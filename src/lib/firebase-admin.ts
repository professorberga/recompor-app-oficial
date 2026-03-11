import * as admin from 'firebase-admin';

/**
 * Singleton para inicialização do Firebase Admin SDK no servidor.
 * Detecta se a aplicação já possui instâncias ativas para evitar erros de reinicialização.
 * Adicionado try-catch para evitar quebras durante o 'next build' no pipeline de produção.
 */
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.warn('[FirebaseAdmin] Falha na inicialização durante a build. Isso é esperado se as credenciais de produção não estiverem disponíveis no ambiente de compilação.');
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
