import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth/AuthContext';
import type { AuthContextType } from '@/contexts/auth/types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
