import { createContext, useContext } from 'react';
import { useCelebrities } from '../hooks/useCelebrities';

const CelebCtx = createContext(null);

export function CelebProvider({ children }) {
  const value = useCelebrities();
  return <CelebCtx.Provider value={value}>{children}</CelebCtx.Provider>;
}

export function useCelebContext() {
  const ctx = useContext(CelebCtx);
  if (!ctx) throw new Error('useCelebContext must be inside CelebProvider');
  return ctx;
}
