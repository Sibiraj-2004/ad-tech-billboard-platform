import { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const showToast = useCallback((message, type = 'success') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast(message);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
