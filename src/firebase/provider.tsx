
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, setDoc, getDoc, Unsubscribe } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// Re-exportando hooks de documentos e coleções para acesso centralizado
export * from './firestore/use-collection';
export * from './firestore/use-doc';

interface TeacherAssignment {
  classId: string;
  className: string;
  subject: string;
  dayOfWeek?: string;
  lessonNumber?: string;
}

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Professor';
  subjects: string[];
  schoolName?: string;
  academicYear?: string;
  activeBimestre?: string;
  assignments?: TeacherAssignment[];
}

interface UserAuthState {
  user: User | null;
  profile: TeacherProfile | null;
  isAdmin: boolean;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export interface FirebaseServicesAndUser extends FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// UID do Administrador conhecido
const ADMIN_UID = "U3vapjp9K2NqRpYdp2ZzJ8vfZsm1";

export const FirebaseProvider: React.FC<{
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}> = ({ children, firebaseApp, firestore, auth }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    isUserLoading: true,
    userError: null,
  });

  // Ref para gerenciar o unsubscribe do perfil de forma manual e segura
  const profileUnsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Limpa qualquer listener de perfil anterior imediatamente ao mudar o estado de auth
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        const teacherRef = doc(firestore, 'teachers', firebaseUser.uid);
        
        try {
          // Verifica se o perfil existe. Se não, provisiona.
          const docSnap = await getDoc(teacherRef);
          if (!docSnap.exists()) {
            const isKnownAdmin = firebaseUser.uid === ADMIN_UID;
            const newProfile: TeacherProfile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Docente",
              email: firebaseUser.email || "",
              role: isKnownAdmin ? 'Admin' : 'Professor',
              subjects: [],
              schoolName: isKnownAdmin ? "Escola Central" : "E.E. Professor Milton Santos",
              academicYear: new Date().getFullYear().toString(),
              activeBimestre: "1",
              assignments: []
            };
            await setDoc(teacherRef, newProfile);
          }

          // Estabelece a escuta em tempo real para mudanças no perfil
          profileUnsubscribeRef.current = onSnapshot(teacherRef, (snapshot) => {
            if (snapshot.exists()) {
              const profileData = snapshot.data() as TeacherProfile;
              setUserAuthState({
                user: firebaseUser,
                profile: { ...profileData, id: snapshot.id },
                isAdmin: profileData.role === 'Admin',
                isUserLoading: false,
                userError: null,
              });
            } else {
              setUserAuthState(prev => ({ ...prev, isUserLoading: false }));
            }
          }, (error) => {
            // Ignora erros de permissão silenciosamente durante logout
            if (error.code === 'permission-denied') return;
            setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: error }));
          });

        } catch (err: any) {
          // Se falhar o getDoc inicial (comum em logout rápido), limpa o estado
          setUserAuthState({
            user: null,
            profile: null,
            isAdmin: false,
            isUserLoading: false,
            userError: err,
          });
        }
      } else {
        // Usuário deslogado: Limpa estado e interrompe carregamento
        setUserAuthState({
          user: null,
          profile: null,
          isAdmin: false,
          isUserLoading: false,
          userError: null,
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribeRef.current) profileUnsubscribeRef.current();
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userAuthState
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase deve ser usado dentro de um FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Serviços core do Firebase não disponíveis.');
  }
  return context as FirebaseServicesAndUser;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useUser = () => {
  const { user, profile, isAdmin, isUserLoading, userError } = useFirebase();
  return { user, profile, isAdmin, isUserLoading, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  if(typeof memoized === 'object' && memoized !== null) {
    (memoized as any).__memo = true;
  }
  return memoized;
}
