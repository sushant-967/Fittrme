import React from 'react';

export type User = {
  email: string;
  userId: number;
  username: string;
};

export type AuthContextType = {
  token: string | null;
  user: User | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);