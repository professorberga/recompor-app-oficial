
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, setDoc, getDoc, Unsubscribe, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
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
      // Limpa inscrições anteriores
      if (profileUnsubscribeRef.current) profileUnsubscribeRef.current();
      if (schoolUnsubscribeRef.current) schoolUnsubscribeRef.current();

      if (firebaseUser) {
        const teacherRef = doc(firestore, 'teachers', firebaseUser.uid);
        const schoolRef = doc(firestore, 'settings', 'school');
        
        try {
          // 1. Escuta Global de Configurações
          schoolUnsubscribeRef.current = onSnapshot(schoolRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserAuthState(prev => ({ 
                ...prev, 
                schoolConfig: snapshot.data() as SchoolConfig 
              }));
            }
          });

          // 2. PROTOCOLO BAVELLONI: Busca Híbrida e Migração por UID
          const normalizedEmail = firebaseUser.email?.toLowerCase().trim();
          const q = query(collection(firestore, 'teachers'), where('email', '==', normalizedEmail));
          const querySnap = await getDocs(q);
          
          let profileDocSnap = await getDoc(teacherRef);
          
          // Se o UID doc não existe mas o e-mail existe, migra
          if (!profileDocSnap.exists() && !querySnap.empty) {
            const legacyDoc = querySnap.docs[0];
            const data = legacyDoc.data() as TeacherProfile;
            
            const profileData = { 
              ...data, 
              id: firebaseUser.uid,
              role: data.role || (firebaseUser.uid === ADMIN_UID ? 'Admin' : 'Professor')
            };
            
            console.log(`[Provider] Sincronizando ID legado ${legacyDoc.id} -> ${firebaseUser.uid}`);
            await setDoc(teacherRef, profileData, { merge: true });
            
            if (legacyDoc.id !== firebaseUser.uid) {
              await deleteDoc(legacyDoc.ref);
            }
            profileDocSnap = await getDoc(teacherRef);
          }

          if (profileDocSnap.exists()) {
            profileUnsubscribeRef.current = onSnapshot(teacherRef, (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as TeacherProfile;
                setUserAuthState(prev => ({
                  ...prev,
                  user: firebaseUser,
                  profile: { ...data, id: snapshot.id },
                  isAdmin: data.role === 'Admin' || firebaseUser.uid === ADMIN_UID,
                  isUserLoading: false,
                }));
              }
            });
          } else {
            console.warn("[Auth] Usuário sem perfil institucional. Redirecionando para login.");
            setUserAuthState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false }));
          }

        } catch (err: any) {
          console.error("Erro na sincronização:", err);
          setUserAuthState(prev => ({ ...prev, isUserLoading: false, userError: err }));
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
