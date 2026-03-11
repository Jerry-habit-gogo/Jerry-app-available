import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // TODO: Replace with your Firebase project configuration
  apiKey: "YOUR_API_KEY",
  authDomain: "jerry-app-demo.firebaseapp.com",
  projectId: "jerry-app-demo",
  storageBucket: "jerry-app-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// 1. Initialize Firebase App (ensure single instance)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 2. Initialize Firebase Auth with React Native AsyncStorage
let auth;
try {
  // If multiple hot reloads happen, getAuth will return the initialized instance
  auth = getAuth(app);
} catch (e) {
  // First time initialization
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// 3. Initialize other services
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
