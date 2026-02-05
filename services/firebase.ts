import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserTier, GlobalSettings } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let auth: any;
let googleProvider: any;
let db: any;
let isMocking = false;

try {
  // Only initialize if we haven't already
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  auth = getAuth();
  db = getFirestore();
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.warn("Firebase initialization failed (likely missing keys). Using Mock Auth.", error);
  isMocking = true;
}

const DEFAULT_FREE_LIMIT = 1;
const DEFAULT_PREMIUM_LIMIT = 100;

export const userService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isMocking) return null;
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  async createUserProfile(user: User) {
    if (isMocking) return;
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        tier: 'FREE', // Default tier
        usage: {
          video: 0,
          music: 0,
          image: 0,
          tts: 0,
          imagen: 0
        },
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    } else {
      await updateDoc(userRef, { lastLoginAt: Date.now() });
      return docSnap.data() as UserProfile;
    }
  },

  async checkLimit(uid: string, feature: keyof UserProfile['usage']): Promise<boolean> {
    if (isMocking) return true;
    const profile = await this.getUserProfile(uid);
    if (!profile) return false;

    // Get limits from settings or defaults
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.exists() ? settingsSnap.data() as GlobalSettings : { freeLimit: DEFAULT_FREE_LIMIT, premiumLimit: DEFAULT_PREMIUM_LIMIT };

    const limit = profile.tier === 'PREMIUM' ? settings.premiumLimit : settings.freeLimit;
    return profile.usage[feature] < limit;
  },

  async incrementUsage(uid: string, feature: keyof UserProfile['usage']) {
    if (isMocking) return;
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      [`usage.${feature}`]: increment(1)
    });
  }
};

export const adminService = {
  async getAllUsers(): Promise<UserProfile[]> {
    if (isMocking) return [];
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  },

  async updateUserTier(uid: string, tier: UserTier) {
    if (isMocking) return;
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { tier });
  },

  async updateGlobalSettings(settings: GlobalSettings) {
    if (isMocking) return;
    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, settings, { merge: true });
  },

  async getGlobalSettings(): Promise<GlobalSettings> {
    const defaults = {
      freeLimit: DEFAULT_FREE_LIMIT,
      premiumLimit: DEFAULT_PREMIUM_LIMIT,
      packagePrice: 200000,
      promoPrice: 50000
    };
    if (isMocking) return defaults;
    const settingsRef = doc(db, 'settings', 'global');
    const snap = await getDoc(settingsRef);
    if (!snap.exists()) return defaults;

    const data = snap.data();
    return {
      ...defaults,
      ...data
    } as GlobalSettings;
  },

  async deleteUser(uid: string) {
    if (isMocking) return;
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', uid));
      // Note: Deleting from Auth usually requires Admin SDK or Cloud Functions
      // For client-side admin panel, we can only clean up the database record
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
};

export const signInWithGoogle = async () => {
  if (isMocking || !auth) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      uid: 'mock-user-123',
      displayName: 'Demo Commander',
      email: 'commander@dcgen.ai',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Create or update profile on login
    await userService.createUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async () => {
  if (isMocking || !auth) {
    return;
  }
  await firebaseSignOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (isMocking || !auth) {
    return () => { };
  }
  return onAuthStateChanged(auth, callback);
};
