import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAuthToken,
  clearSession as clearStorageSession,
  isOnboarding5aDone,
  isPendingVerification,
} from '@/services/storage';

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  onboarding5aDone: boolean;
  pendingVerification: boolean;
};

type AuthContextValue = AuthState & {
  refreshAuthState: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    onboarding5aDone: false,
    pendingVerification: false,
  });

  const refreshAuthState = useCallback(async () => {
    const [token, onboarding5aDone, pendingVerification] = await Promise.all([
      getAuthToken(),
      isOnboarding5aDone(),
      isPendingVerification(),
    ]);

    setState({
      isLoading: false,
      isAuthenticated: Boolean(token),
      onboarding5aDone,
      pendingVerification,
    });
  }, []);

  const signOut = useCallback(async () => {
    await clearStorageSession();
    await refreshAuthState();
  }, [refreshAuthState]);

  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

  const value = useMemo(
    () => ({
      ...state,
      refreshAuthState,
      signOut,
    }),
    [state, refreshAuthState, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
