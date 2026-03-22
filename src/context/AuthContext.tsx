import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { registerForPushNotificationsAsync } from "../lib/notifications";

interface User {
  uid: string;
  email: string | null;
  mobile?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  setMobile: (mobile: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.EXPO_PUBLIC_USE_EMULATORS === "true";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        const storedMobile = await AsyncStorage.getItem(
          `mobile_${firebaseUser.uid}`,
        );
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          mobile: storedMobile || undefined,
        });

        // Handle FCM token registration
        handleFCMRegistration(firebaseUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleFCMRegistration = async (uid: string) => {
    try {
      let token = "placeholder-dev-token";

      if (!isDev) {
        const result = await registerForPushNotificationsAsync();
        if (result) token = result;
      }

      if (token) {
        // Update driver record with token
        await db.collection("drivers").doc(uid).set(
          {
            fcmToken: token,
            lastActive: new Date().toISOString(),
          },
          { merge: true },
        );
        console.log(`FCM Token registered (${isDev ? "Dev" : "Prod"}):`, token);
      }
    } catch (e) {
      console.error("Failed to register FCM token:", e);
    }
  };

  const login = async (email: string, pass: string) => {
    await auth.signInWithEmailAndPassword(email, pass);
  };

  const logout = async () => {
    await auth.signOut();
  };

  const setMobile = async (mobile: string) => {
    if (user) {
      await AsyncStorage.setItem(`mobile_${user.uid}`, mobile);
      setUser({ ...user, mobile });
    }
  };

  const verifyOTP = async (otp: string) => {
    // Mock OTP verification - anything 123456 works
    return otp === "123456";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, setMobile, verifyOTP }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
