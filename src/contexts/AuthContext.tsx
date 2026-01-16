import React, { createContext, useContext } from 'react';
import {getAuthVisitorData, removeAuthVisitorData} from "../utils";

interface AuthContextType {
  visitor: any;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const visitor = getAuthVisitorData()

  const signOut = async () => {
    removeAuthVisitorData()
    window.location.href = "/"
  };

  const value = {
    signOut,
    visitor
  };

  return (
    <AuthContext.Provider value={value}>
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