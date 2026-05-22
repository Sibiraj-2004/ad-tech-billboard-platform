import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'glass-card !bg-surface-800 !text-white !border-surface-700',
        duration: 4000,
        style: {
          borderRadius: '12px',
          padding: '12px 24px',
        },
      }}
    />
  );
}
