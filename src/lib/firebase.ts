import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDI7RHXYN8AVAjup7p2YaoYhatfGIJajYY",
  authDomain: "asian-b1f71.firebaseapp.com",
  projectId: "asian-b1f71",
  storageBucket: "asian-b1f71.firebasestorage.app",
  messagingSenderId: "637438990692",
  appId: "1:637438990692:web:1cd8f896bb1e2905e74271",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
