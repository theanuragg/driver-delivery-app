import { getApp, getApps, initializeApp } from "firebase/app";
import {
    connectAuthEmulator,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    addDoc,
    collection,
    connectFirestoreEmulator,
    doc,
    getFirestore,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { mockAuth, mockFirestore } from "./mockFirebase";

// Real configuration - users can add their own
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "mock-api-key",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "mock-project",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

let auth: any;
let db: any;

const isDev = process.env.NODE_ENV === "development";
const useEmulators = process.env.EXPO_PUBLIC_USE_EMULATORS === "true";

// Force Mock Mode if emulators are explicitly disabled OR if no API key is present
if (
  !useEmulators &&
  (process.env.FIREBASE_API_KEY === undefined ||
    process.env.FIREBASE_API_KEY === "" ||
    process.env.FIREBASE_API_KEY === "mock-api-key-for-dev")
) {
  auth = mockAuth;
  db = mockFirestore;
  console.log("Firebase is running in Mock Mode (Local Data).");
} else {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const realAuth = getAuth(app);
  const realDb = getFirestore(app);

  if (useEmulators) {
    // Connect to local emulators
    connectAuthEmulator(realAuth, "http://localhost:9099");
    connectFirestoreEmulator(realDb, "localhost", 8080);
    console.log("Firebase is running with Local Emulators.");
  }

  // Wrap Auth for consistent API
  auth = {
    get currentUser() {
      return realAuth.currentUser;
    },
    onAuthStateChanged: (callback: any) =>
      onAuthStateChanged(realAuth, callback),
    signInWithEmailAndPassword: (email: string, pass: string) =>
      signInWithEmailAndPassword(realAuth, email, pass),
    signOut: () => signOut(realAuth),
  };

  // Wrap Firestore for consistent API
  db = {
    collection: (path: string) => ({
      add: (data: any) => addDoc(collection(realDb, path), data),
      where: (field: string, op: any, val: any) => ({
        onSnapshot: (callback: any) => {
          const q = query(collection(realDb, path), where(field, op, val));
          return onSnapshot(q, (snapshot) => {
            callback({
              docs: snapshot.docs.map((doc) => ({
                id: doc.id,
                data: () => doc.data(),
              })),
            });
          });
        },
      }),
      doc: (docId: string) => ({
        update: (data: any) => updateDoc(doc(realDb, path, docId), data),
        set: (data: any, options: any) =>
          setDoc(doc(realDb, path, docId), data, options),
        onSnapshot: (callback: any) => {
          return onSnapshot(doc(realDb, path, docId), (snapshot) => {
            callback({
              id: snapshot.id,
              exists: snapshot.exists(),
              data: () => snapshot.data(),
            });
          });
        },
      }),
    }),
  };
}

export { auth, db };
