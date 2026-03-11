
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import { TeacherProfile } from '@/lib/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  profile: TeacherProfile | null;
  isAdmin: boolean;
  schoolConfig: any;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  profile: TeacherProfile | null;
  isAdmin: boolean;
  schoolConfig: any;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [schoolConfig, setSchoolConfig] = useState<any>(null);

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // Escuta global das configurações da escola
    const unsubscribeSchool = onSnapshot(doc(firestore, "settings", "school"), (snap) => {
      setSchoolConfig(snap.data() || null);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSchool();
    };
  }, [auth, firestore]);

  // Escuta do perfil do docente logado
  useEffect(() => {
    if (!userAuthState.user || !firestore) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }

    const unsubscribeProfile = onSnapshot(doc(firestore, "teachers", userAuthState.user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as TeacherProfile;
        setProfile(data);
        setIsAdmin(data.role === 'Admin');
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribeProfile();
  }, [userAuthState.user, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      profile,
      isAdmin,
      schoolConfig,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState, profile, isAdmin, schoolConfig]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    profile: context.profile,
    isAdmin: context.isAdmin,
    schoolConfig: context.schoolConfig,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useUser = () => { 
  const { user, isUserLoading, userError, profile, isAdmin, schoolConfig } = useFirebase(); 
  return { user, isUserLoading, userError, profile, isAdmin, schoolConfig }; 
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps) as T & {__memo?: boolean};
  if (memoized && typeof memoized === 'object') memoized.__memo = true;
  return memoized;
}
