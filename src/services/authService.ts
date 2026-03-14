import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { getUserProfile } from './profileService';
import { User } from '../types';

const USERS_COLLECTION = 'users';

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoUrl: firebaseUser.photoURL,
  bio: null,
});

const ensureFirebaseConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured.');
  }
};

const createUserDocument = async (user: FirebaseUser) => {
  await setDoc(
    doc(db, USERS_COLLECTION, user.uid),
    {
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoURL,
      bio: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  ensureFirebaseConfigured();

  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }

  await createUserDocument(auth.currentUser ?? credential.user);
  return mapFirebaseUser(auth.currentUser ?? credential.user);
};

export const signInWithEmail = async (email: string, password: string) => {
  ensureFirebaseConfigured();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(credential.user);
};

export const signOutCurrentUser = async () => {
  ensureFirebaseConfigured();
  await signOut(auth);
};

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    getUserProfile(firebaseUser.uid)
      .then((profile) => {
        callback(profile ?? mapFirebaseUser(firebaseUser));
      })
      .catch(() => {
        callback(mapFirebaseUser(firebaseUser));
      });
  });
};
