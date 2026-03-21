import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      if (firebaseUser) {
        const storedMobile = await AsyncStorage.getItem(`mobile_${firebaseUser.uid}`);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          mobile: storedMobile || undefined
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
    return otp === '123456';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setMobile, verifyOTP }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
