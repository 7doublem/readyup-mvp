// Global authentication state and methods
// Wraps the entire app via <AuthProvider>. Any component can call useAuth()
// to access the current user, their role, avatar, display name, and methods
// for signup, login, logout, and password reset.
//
// On mount, onAuthStateChanged checks if a session exists (Firebase persists
// sessions in localStorage by default). If a user is found, their Firestore
// profile is fetched to get their role (staff/user), avatar, and display name.
// The loading flag prevents the app from rendering routes before the auth
// state is known, avoiding a flash of the login page.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import toast from "react-hot-toast";
import { getAuthErrorMessage } from "../utils/authErrors";

// Default avatar (GTA V) used when a user has no avatar set
const DEFAULT_AVATAR =
  "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg";

// The two roles in the system: regular users and staff who manage events
type UserRole = "user" | "staff";

// Shape of the context value available to any component via useAuth()
interface AuthContextType {
  user: User | null;       // Firebase Auth user object (null if logged out)
  role: UserRole | null;   // Role fetched from the Firestore users collection
  avatarUrl: string;       // User's avatar URL from Firestore
  displayName: string;     // User's gamertag from Firestore
  loading: boolean;        // True while the initial auth check is in progress
  signup: (email: string, password: string, displayName: string, avatarUrl?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires once on mount (with the cached session if any)
    // and again whenever the user logs in or out
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch the user's role from their Firestore document
        // This is what powers role-based access (e.g. staff vs user)
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role as UserRole);
          setAvatarUrl(userDoc.data().avatarUrl || DEFAULT_AVATAR);
          setDisplayName(userDoc.data().displayName || "");
        }
      } else {
        setUser(null);
        setRole(null);
        setAvatarUrl("");
        setDisplayName("");
      }
      setLoading(false);
    });

    // Cleanup the listener when the provider unmounts
    return unsubscribe;
  }, []);

  async function signup(email: string, password: string, displayName: string, avatarUrl = "") {
    try {
      // Create the Firebase Auth account first
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Immediately create the matching Firestore document in users/{uid}
      // This must happen before the user is redirected, so the role is available
      // The role is hardcoded to "user" — only an admin can set someone as "staff"
      await setDoc(doc(db, "users", credential.user.uid), {
        email,
        displayName,
        role: "user",
        avatarUrl,
        joinedAt: serverTimestamp(),
      });

      setRole("user");
      setAvatarUrl(avatarUrl);
      setDisplayName(displayName);
    } catch (error) {
      // Display a friendly error message (mapped from Firebase error codes)
      toast.error(getAuthErrorMessage(error));
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // After signing in, fetch the role so the app knows what this user can do
      const userDoc = await getDoc(doc(db, "users", credential.user.uid));
      if (userDoc.exists()) {
        setRole(userDoc.data().role as UserRole);
        setAvatarUrl(userDoc.data().avatarUrl || DEFAULT_AVATAR);
        setDisplayName(userDoc.data().displayName || "");
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      throw error;
    }
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setAvatarUrl("");
  }

  // Sends a password reset email via Firebase Auth
  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Check your inbox.");
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, role, avatarUrl, displayName, loading, signup, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for any component to access auth state and methods
// Must be used inside <AuthProvider> or it will throw
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
