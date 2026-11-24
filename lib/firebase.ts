import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import firebaseConfig from "../firebase-applet-config.json";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Connect to the same provisioned Firebase Auth & Firestore instance used in design-system
export const auth = getAuth(app);
export const db: any = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

export const ADMIN_EMAIL = "rolan.bacalla@gmail.com";

export function isBootstrappedAdminEmail(email?: string | null): boolean {
  return typeof email === "string" && email.trim().toLowerCase() === ADMIN_EMAIL;
}

let analytics: any = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn("Firebase Analytics is not supported in this environment:", err);
    });
}

export const logFirebaseEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && analytics) {
    try {
      logEvent(analytics, eventName, params);
    } catch (error) {
      console.warn(`Firebase Analytics failed to log event "${eventName}":`, error);
    }
  }
};

export { app, analytics };
