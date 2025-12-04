// Inicialização mínima do Firebase para uso no cliente
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCrNhsP1EdYwXnWZQYKK36CAaJ28Pu5k4g",
  authDomain: "portalmodelo78.firebaseapp.com",
  projectId: "portalmodelo78",
  storageBucket: "portalmodelo78.appspot.com",
  // Observação: o bucket padrão do Firebase costuma terminar em .appspot.com.
  // Se os uploads falharem, verifique no Console do Firebase qual é o bucket correto.
  messagingSenderId: "232849033026",
  appId: "1:232849033026:web:a0882ab89b2033ca34eadb",
  measurementId: "G-M8VQV2K4CV"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Nota: coloque as variáveis de ambiente em .env.local (NEXT_PUBLIC_*)
