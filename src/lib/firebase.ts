import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { mockAuth, mockFirestore } from './mockFirebase';

// Real configuration - users can add their own
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

let auth: any;
let db: any;

// Use mock if no API key is set
if (process.env.FIREBASE_API_KEY === undefined || process.env.FIREBASE_API_KEY === "") {
  auth = mockAuth;
  db = mockFirestore;
  console.log("Firebase is running in Mock Mode.");
} else {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
