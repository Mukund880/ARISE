import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAklY1ikdBguVgwcVvQtzJeiov8Na4V2k",
  authDomain: "arise-lms.firebaseapp.com",
  databaseURL: "https://arise-lms-default-rtdb.firebaseio.com",
  projectId: "arise-lms",
  storageBucket: "arise-lms.firebasestorage.app",
  messagingSenderId: "902839612824",
  appId: "1:902839612824:web:9b1b682c93c8e732f427ed",
  measurementId: "G-Z23LT4F8W7"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
