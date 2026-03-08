
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// Re-exportando hooks de documentos e coleções para acesso centralizado
export * from './firestore/use-collection';
export * from './firestore/use-doc';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Professor';
  subjects: string[];
  schoolName?: string;
  academicYear?: string;
  activeBimestre?: string;
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const teacherRef = doc(firestore, 'teachers', firebaseUser.uid);
        
        // Antes de liberar o carregamento, garantimos que o perfil existe ou é provisionado
        const docSnap = await getDoc(teacherRef);
        
        if (!docSnap.exists()) {
          // Provisionamento automático se o documento não existir
          const newProfile: TeacherProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Professor",
            email: firebaseUser.email || "",
            role: 'Professor', // Padrão seguro para novos usuários
            subjects: [],
            schoolName: "E.E. Professor Milton Santos",
            academicYear: new Date().getFullYear().toString(),
            activeBimestre: "1"
          };
          
          try {
            await setDoc(teacherRef, newProfile);
          } catch (err) {
            console.error("Erro ao provisionar perfil:", err);
          }
        }

        // Estabelece a escuta em tempo real para mudanças no perfil
        const unsubscribeProfile = onSnapshot(teacherRef, (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.data() as TeacherProfile;
            setUserAuthState({
              user: firebaseUser,
              profile: { ...profileData, id: snapshot.id },
              isAdmin: profileData.role === 'Admin',
              isUserLoading: false,
              userError: null,
            });
          }
        }, (error) => {
          console.error("Erro na escuta do perfil (Firestore Rules?):", error);
          setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: error }));
        });

        return () => unsubscribeProfile();
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

    return () => unsubscribeAuth();
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
