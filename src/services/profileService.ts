import { updateProfile } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { auth, db, isFirebaseConfigured, storage } from './firebase';
import { User } from '../types';

const USERS_COLLECTION = 'users';

const ensureConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured.');
  }
};

export const getUserProfile = async (userId: string) => {
  ensureConfigured();

  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    email: (data.email as string | null) ?? null,
    displayName: (data.displayName as string | null) ?? null,
    photoUrl: (data.photoUrl as string | null) ?? null,
    bio: (data.bio as string | null) ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.(),
  } satisfies User;
};

export const upsertUserProfileDocument = async (
  userId: string,
  data: Partial<Pick<User, 'email' | 'displayName' | 'photoUrl' | 'bio'>>,
  options?: { preserveCreatedAt?: boolean }
) => {
  ensureConfigured();

  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      ...data,
      ...(options?.preserveCreatedAt ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const uploadProfileImage = async (userId: string, localUri: string) => {
  ensureConfigured();

  const response = await fetch(localUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}.jpg`);

  await uploadBytes(imageRef, blob, {
    contentType: blob.type || 'image/jpeg',
  });

  return getDownloadURL(imageRef);
};

export const updateCurrentUserProfile = async (input: {
  displayName: string;
  bio: string;
  photoUrl?: string | null;
  localImageUri?: string | null;
}) => {
  ensureConfigured();

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Authentication required.');
  }

  let resolvedPhotoUrl = input.photoUrl ?? currentUser.photoURL ?? null;

  if (input.localImageUri) {
    resolvedPhotoUrl = await uploadProfileImage(currentUser.uid, input.localImageUri);
  }

  await updateProfile(currentUser, {
    displayName: input.displayName.trim(),
    photoURL: resolvedPhotoUrl,
  });

  await upsertUserProfileDocument(
    currentUser.uid,
    {
      email: currentUser.email,
      displayName: input.displayName.trim(),
      photoUrl: resolvedPhotoUrl,
      bio: input.bio.trim(),
    },
    { preserveCreatedAt: true }
  );

  return getUserProfile(currentUser.uid);
};
