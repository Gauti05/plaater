// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// // --- ADDED 'export' KEYWORD BELOW ---
// export const firebaseConfig = {
//   apiKey: "AIzaSyBkWAwomgQTBYQYXuBeoX28NV5PSijn_8Y",
//   authDomain: "authpages-2a30c.firebaseapp.com",
//   projectId: "authpages-2a30c",
//   storageBucket: "authpages-2a30c.firebasestorage.app",
//   messagingSenderId: "411231960074",
//   appId: "1:411231960074:web:7b150f93b715be9ef0b3f3",
//   measurementId: "G-Z4BF0W0QF8"
// };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);



import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your NEW Company Config
const firebaseConfig = {
  apiKey: "AIzaSyAh4bH5pzvWDZFjNtrI92oq1mUsPG98M-Q",
  authDomain: "bizzeazyr.firebaseapp.com",
  projectId: "bizzeazyr",
  storageBucket: "bizzeazyr.firebasestorage.app",
  messagingSenderId: "110648926956",
  appId: "1:110648926956:web:cbd359775265df8fdc7bc9",
  measurementId: "G-CY9TTZVH10"
};

// 🔥 FIX: Check if app is already initialized to prevent "[DEFAULT] already exists" error
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);