import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { colors, radii, typography } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info';

type ToastMessage = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showNetworkError: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  const show = useCallback((message: string, type: ToastType) => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      dismiss();
    }, TOAST_DURATION_MS);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      showSuccess: (message: string) => show(message, 'success'),
      showError: (message: string) => show(message, 'error'),
      showInfo: (message: string) => show(message, 'info'),
      showNetworkError: () => show('Check your connection', 'error'),
    }),
    [show],
  );

  const backgroundColor =
    toast?.type === 'success'
      ? colors.success
      : toast?.type === 'error'
        ? colors.danger
        : colors.surface;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          entering={FadeInUp.springify().damping(18).stiffness(200)}
          exiting={FadeOutUp.springify()}
          style={[styles.toastContainer, { backgroundColor }]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.button,
    zIndex: 9999,
    elevation: 8,
  },
  toastText: {
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    textAlign: 'center',
  },
});
