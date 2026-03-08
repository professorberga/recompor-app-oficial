
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, setDoc, getDoc, Unsubscribe, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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

interface SchoolConfig {
  schoolName: string;
  academicYear: string;
  activeBimestre: string;
}

interface UserAuthState {
  user: User | null;
  profile: TeacherProfile | null;
  schoolConfig: SchoolConfig | null;
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
    schoolConfig: null,
    isAdmin: false,
    isUserLoading: true,
    userError: null,
  });

  const profileUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const schoolUnsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsubscribeRef.current) profileUnsubscribeRef.current();
      if (schoolUnsubscribeRef.current) schoolUnsubscribeRef.current();

      if (firebaseUser) {
        const teacherRef = doc(firestore, 'teachers', firebaseUser.uid);
        const schoolRef = doc(firestore, 'settings', 'school');
        
        try {
          // 1. Escuta Global de Configurações da Escola
          schoolUnsubscribeRef.current = onSnapshot(schoolRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserAuthState(prev => ({ 
                ...prev, 
                schoolConfig: snapshot.data() as SchoolConfig 
              }));
            }
          });

          // 2. Busca Perfil por UID (Prioridade) ou E-mail (Migração)
          const docSnap = await getDoc(teacherRef);
          
          if (!docSnap.exists()) {
            // Busca se o perfil existe nomeado pelo e-mail ou se há documento com este e-mail
            const q = query(collection(firestore, 'teachers'), where('email', '==', firebaseUser.email));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              // MIGRAÇÃO AUTOMÁTICA: Encontrou pelo e-mail
              const legacyDoc = querySnap.docs[0];
              const data = legacyDoc.data() as TeacherProfile;
              
              // Cria novo doc com UID
              const profileData = { ...data, id: firebaseUser.uid };
              await setDoc(teacherRef, profileData);
              
              // Deleta o legado se o ID for diferente do UID (ex: era o e-mail)
              if (legacyDoc.id !== firebaseUser.uid) {
                await deleteDoc(legacyDoc.ref);
              }
            } else {
              // Provedor de fallback: Cria perfil básico se nada for encontrado (handshake de primeiro acesso)
              const isKnownAdmin = firebaseUser.uid === ADMIN_UID;
              const defaultProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Docente",
                email: firebaseUser.email || "",
                role: isKnownAdmin ? 'Admin' : 'Professor',
                subjects: [],
                assignments: []
              };
              await setDoc(teacherRef, defaultProfile);
            }
          }

          // 3. Estabelece a escuta em tempo real para o perfil (agora garantido no UID)
          profileUnsubscribeRef.current = onSnapshot(teacherRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as TeacherProfile;
              setUserAuthState(prev => ({
                ...prev,
                user: firebaseUser,
                profile: { ...data, id: snapshot.id },
                isAdmin: data.role === 'Admin' || firebaseUser.uid === ADMIN_UID,
                isUserLoading: false,
                userError: null,
              }));
            }
          }, (error) => {
            if (error.code === 'permission-denied') return;
            setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: error }));
          });

        } catch (err: any) {
          setUserAuthState(prev => ({
            ...prev,
            isUserLoading: false,
            userError: err,
          }));
        }
      } else {
        setUserAuthState({
          user: null,
          profile: null,
          schoolConfig: null,
          isAdmin: false,
          isUserLoading: false,
          userError: null,
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribeRef.current) profileUnsubscribeRef.current();
      if (schoolUnsubscribeRef.current) schoolUnsubscribeRef.current();
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
  const { user, profile, schoolConfig, isAdmin, isUserLoading, userError } = useFirebase();
  return { user, profile, schoolConfig, isAdmin, isUserLoading, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);
  if(typeof memoized === 'object' && memoized !== null) {
    (memoized as any).__memo = true;
  }
  return memoized;
}
