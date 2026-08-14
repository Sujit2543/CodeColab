import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#161b22',
          color: '#e6edf3',
          border: '1px solid #30363d',
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        },
        success: { iconTheme: { primary: '#3fb950', secondary: '#161b22' } },
        error:   { iconTheme: { primary: '#f85149', secondary: '#161b22' } },
        duration: 3000,
      }}
    />
  </React.StrictMode>
);
