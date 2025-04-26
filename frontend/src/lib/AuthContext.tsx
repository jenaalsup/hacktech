'use client';

import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  deleteUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function signup(email: string, password: string) {
    if (!email.endsWith('@caltech.edu')) {
      // reject if email isn't @caltech.edu
      return Promise.reject({ code: 'auth/invalid-email-domain', message: 'You must use a Caltech email (@caltech.edu) to sign up.' });
    }
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Handle successful login
      });
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const deleteUser = async () => {
    const user = auth.currentUser; // Get the current user
    if (user) {
      try {
        await user.delete(); // Call the delete method on the current user
        setCurrentUser(null); // Clear the current user from state
      } catch (error) {
        console.error('Error deleting user:', error); // Log the error for debugging
        throw new Error('Failed to delete profile. Please try again.'); // Throw a new error to be caught in the profile page
      }
    }
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    deleteUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};