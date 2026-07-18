import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if the API key is provided
let app;
let db;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("Firebase API key missing. Falling back to mockData.");
  }
} catch (e) {
  console.error("Firebase initialization error", e);
}

export { app, db };
