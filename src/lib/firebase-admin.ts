import * as admin from 'firebase-admin';

/**
 * Singleton para inicialização do Firebase Admin SDK no servidor.
 * Detecta se a aplicação já possui instâncias ativas para evitar erros de reinicialização.
 */
if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
