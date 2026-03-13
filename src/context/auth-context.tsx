"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://trade-backend-685436576212.us-central1.run.app";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth && isFirebaseConfigured));
  const router = useRouter();

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Authentication is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.");
    }
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Check backend allowlist
    const res = await fetch(
      `${BACKEND_URL}/api/users/check?email=${encodeURIComponent(result.user.email ?? "")}`
    );
    const data = await res.json();

    if (!data.allowed) {
      await firebaseSignOut(auth);
      throw new Error("Your account is not authorized to access this app.");
    }
  }

  async function signOut() {
    if (!auth || !isFirebaseConfigured) {
      router.push("/login");
      return;
    }
    await firebaseSignOut(auth);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
