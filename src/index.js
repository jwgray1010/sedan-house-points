import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Use AppRouter for routing all pages
import AppRouter from './AppRouter.js';
import reportWebVitals from './reportWebVitals';

// If you use context providers (e.g., AuthProvider, ThemeProvider), import and wrap here:
// import { AuthProvider } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Example with context providers:
    <AuthProvider>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </AuthProvider>
    */}
    <AppRouter />
  </React.StrictMode>
);

reportWebVitals();

// SUGGESTIONS IMPLEMENTED:
// 1. Uses AppRouter for routing instead of App.
// 2. Shows where to add context providers for auth, theme, etc.
// 3. For accessibility, ensure your public/index.html has <html lang="en"> and <meta charset="utf-8">.
// 4. For PWA/offline support, consider adding service worker registration (see CRA docs).
