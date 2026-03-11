import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // TODO: Replace with your Firebase project configuration
  apiKey: "YOUR_API_KEY",
  authDomain: "jerry-app-demo.firebaseapp.com",
  projectId: "jerry-app-demo",
  storageBucket: "jerry-app-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'jerry-app-demo';

// 1. Initialize Firebase App (ensure single instance)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize only the services currently used by the app.
const db = getFirestore(app);

export { app, db };
