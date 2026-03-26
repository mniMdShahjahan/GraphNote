import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export default function Auth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) return <div className="animate-pulse h-10 w-24 bg-gray-200 rounded-full"></div>;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <UserIcon className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <span className="hidden md:inline text-sm font-medium text-gray-700">{user.displayName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
    >
      <LogIn className="w-4 h-4" />
      <span>Sign in with Google</span>
    </button>
  );
}
