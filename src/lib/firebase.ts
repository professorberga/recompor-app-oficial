
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

/**
 * Inicialização segura do Firebase App.
 * Verifica se as variáveis de ambiente obrigatórias estão presentes antes da inicialização
 * para evitar "Internal Server Error" durante a renderização no lado do servidor.
 */
function getSafeApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  // Se as variáveis de ambiente essenciais estiverem ausentes, não inicializa
  // Isso evita que o build quebre em ambientes onde as variáveis ainda não foram injetadas.
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("[Firebase] Configurações de API ausentes no ambiente.");
    return null;
  }

  return initializeApp(firebaseConfig);
}

export const app = getSafeApp();
