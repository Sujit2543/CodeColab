import { Toaster } from 'react-hot-toast';

export default function Toast() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--bg2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#3fb950', secondary: 'var(--bg2)' } },
        error: { iconTheme: { primary: '#f85149', secondary: 'var(--bg2)' } },
        duration: 3000,
      }}
    />
  );
}
