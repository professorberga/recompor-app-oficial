'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Inicializa o Firebase SDK no cliente com configuração explícita.
 */
export function initializeFirebase() {
  const app = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp();
    
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export { FirebaseProvider, useFirebase, useAuth, useFirestore, useFirebaseApp, useUser, useMemoFirebase } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { FirestorePermissionError } from './errors';
export { errorEmitter } from './error-emitter';
export * from './non-blocking-updates';
export * from './non-blocking-login';
