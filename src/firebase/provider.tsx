
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

          // 2. Busca Perfil com Handshake de Migração Híbrida
          let docSnap = await getDoc(teacherRef);
          
          if (!docSnap.exists()) {
            // Se não encontrar pelo UID, tenta buscar pela query de e-mail (flexibilidade para migração)
            const q = query(collection(firestore, 'teachers'), where('email', '==', firebaseUser.email));
            const querySnap = await getDocs(q);
            
            if (!querySnap.empty) {
              const legacyDoc = querySnap.docs[0];
              const data = legacyDoc.data() as TeacherProfile;
              
              const profileData = { 
                ...data, 
                id: firebaseUser.uid,
                role: data.role || (firebaseUser.uid === ADMIN_UID ? 'Admin' : 'Professor')
              };
              
              // Migração Forçada: Padroniza o ID como UID
              await setDoc(teacherRef, profileData, { merge: true });
              
              // Se o documento antigo tinha um ID diferente do UID (e-mail ou RA), apaga ele
              if (legacyDoc.id !== firebaseUser.uid) {
                await deleteDoc(legacyDoc.ref);
              }
              docSnap = await getDoc(teacherRef);
            }
          }

          if (docSnap.exists()) {
            profileUnsubscribeRef.current = onSnapshot(teacherRef, (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as TeacherProfile;
                console.log(`[Auth] Perfil Carregado: ${data.name} (${data.role})`);
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
            // Se autenticou mas não tem perfil nem via query, encerra sessão
            console.warn("[Auth] Usuário autenticado mas sem perfil institucional.");
            setUserAuthState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false }));
          }

        } catch (err: any) {
          console.error("Erro na sincronização de identidade:", err);
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
