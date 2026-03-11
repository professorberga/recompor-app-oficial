
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Inicializa o Firebase SDK no cliente.
 * Suporta inicialização automática via App Hosting ou fallback via config.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to config.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
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
