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

  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError(`Domain "${window.location.hostname}" is not authorized in Firebase.`);
      } else {
        setAuthError(error.message);
      }
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
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleLogin}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <LogIn className="w-4 h-4" />
        <span>Sign in with Google</span>
      </button>

      {authError && (
        <div className="max-w-xs p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 space-y-2">
          <p className="font-bold">⚠️ {authError}</p>
          {authError.includes('not authorized') && (
            <div className="space-y-2">
              <p>To fix this, go to your Firebase Console and add this domain to "Authorized domains":</p>
              <div className="flex items-center gap-2 p-2 bg-white rounded border border-red-200 font-mono select-all">
                {window.location.hostname}
              </div>
              <a 
                href="https://console.firebase.google.com/project/gen-lang-client-0478851543/authentication/settings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-center py-1.5 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors"
              >
                Open Firebase Console
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
