import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.tsx';
import './index.css';

// Initialize Capacitor when running on mobile
if (Capacitor.isNativePlatform()) {
  console.log('Running on native platform:', Capacitor.getPlatform());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
