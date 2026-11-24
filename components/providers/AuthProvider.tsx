"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, appleProvider, isBootstrappedAdminEmail } from "@/lib/firebase";
import { useProfileStore } from "@/lib/stores/useProfile";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithApple: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  registerWithEmail: (email: string, password: string) => Promise<User>;
  sendResetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signInWithApple: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signInWithEmail: async () => {
    throw new Error("AuthProvider not mounted");
  },
  registerWithEmail: async () => {
    throw new Error("AuthProvider not mounted");
  },
  sendResetPassword: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signOutUser: async () => {
    throw new Error("AuthProvider not mounted");
  },
});

function syncProfileStore(firebaseUser: User) {
  const providerPhoto = firebaseUser.providerData?.find((p) => p?.photoURL)?.photoURL;
  const providerName = firebaseUser.providerData?.find((p) => p?.displayName)?.displayName;
  useProfileStore.getState().updateProfile({
    name: firebaseUser.displayName || providerName || firebaseUser.email?.split("@")[0] || "Traveller",
    avatar:
      firebaseUser.photoURL ||
      providerPhoto ||
      `https://api.dicebear.com/7.x/notionists/png?seed=${firebaseUser.uid}`,
    username: firebaseUser.email?.split("@")[0] || "wanderer",
  });
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        syncProfileStore(nextUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return isBootstrappedAdminEmail(user.email);
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    if (cred.user) syncProfileStore(cred.user);
    return cred.user;
  }, []);

  const signInWithApple = useCallback(async () => {
    const cred = await signInWithPopup(auth, appleProvider, browserPopupRedirectResolver);
    if (cred.user) syncProfileStore(cred.user);
    return cred.user;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) syncProfileStore(cred.user);
    return cred.user;
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) {
      syncProfileStore(cred.user);
      try {
        await sendEmailVerification(cred.user);
      } catch (err) {
        console.warn("Verification email skipped:", err);
      }
    }
    return cred.user;
  }, []);

  const sendResetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAdmin,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      registerWithEmail,
      sendResetPassword,
      signOutUser,
    }),
    [
      user,
      loading,
      isAdmin,
      signInWithGoogle,
      signInWithApple,
      signInWithEmail,
      registerWithEmail,
      sendResetPassword,
      signOutUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
