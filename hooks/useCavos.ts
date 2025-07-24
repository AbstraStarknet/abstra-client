import { AuthContext } from '@/context/AuthContext';
import { useContext } from 'react';

export const useCavos = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useCavos must be used within an AuthProvider');
  }
  return ctx;
};