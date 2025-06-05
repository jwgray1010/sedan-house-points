import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRouter from './AppRouter.js';
import reportWebVitals from './reportWebVitals.js';

// Uncomment and import your context providers if needed
// import { AuthProvider } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* Wrap with providers here if needed */}
    {/* <AuthProvider> */}
    {/*   <ThemeProvider> */}
          <AppRouter />
    {/*   </ThemeProvider> */}
    {/* </AuthProvider> */}
  </React.StrictMode>
);

reportWebVitals();
