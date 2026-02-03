import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- ADDED 'export' KEYWORD BELOW ---
export const firebaseConfig = {
  apiKey: "AIzaSyBkWAwomgQTBYQYXuBeoX28NV5PSijn_8Y",
  authDomain: "authpages-2a30c.firebaseapp.com",
  projectId: "authpages-2a30c",
  storageBucket: "authpages-2a30c.firebasestorage.app",
  messagingSenderId: "411231960074",
  appId: "1:411231960074:web:7b150f93b715be9ef0b3f3",
  measurementId: "G-Z4BF0W0QF8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);