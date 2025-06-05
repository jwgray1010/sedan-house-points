// LoginPage.js - With Firestore Save, Google Sign-In Restriction, Session Tracking, and Accessibility/Polish
import React, { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import './LoginPage.css';
import glowingLogo from '../assets/glowing_logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null);

  // Focus email input on mount for accessibility
  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  // Save teacher info to Firestore
  const saveTeacher = async (user) => {
    const { displayName, email, uid } = user;
    await setDoc(doc(db, 'teachers', uid), {
      name: displayName || email.split('@')[0],
      email,
      uid
    });
  };

  // Handle email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (!email.endsWith('@usd286.org')) {
      setError('❌ Only @usd286.org accounts allowed');
      setLoading(false);
      return;
    }
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await saveTeacher(userCred.user);
      navigate('/dashboard');
    } catch (err) {
      setError('❌ Login failed: Check credentials');
    }
    setLoading(false);
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      if (!userEmail.endsWith('@usd286.org')) {
        setError('❌ Access denied: Use a @usd286.org email');
        auth.signOut();
        setLoading(false);
        return;
      }
      await saveTeacher(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError('❌ Google Sign-In failed');
    }
    setLoading(false);
  };

  // Session tracking and redirect if already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && location.pathname === '/login') {
        navigate('/dashboard');
      } else if (!user && location.pathname !== '/login') {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate, location]);

  // Keyboard accessibility: submit on Enter in password field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  return (
    <div className="login-container" aria-label="Teacher Login Page">
      <img src={glowingLogo} alt="Sedan Logo" className="login-logo" />
      <h2>Teacher Login</h2>
      <form onSubmit={handleLogin} className="login-form" aria-label="Login form">
        <label htmlFor="email" className="visually-hidden">Email</label>
        <input
          id="email"
          ref={emailRef}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          aria-label="Email"
        />
        <label htmlFor="password" className="visually-hidden">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          required
          autoComplete="current-password"
          aria-label="Password"
        />
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          aria-label="Login"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="google-button"
          disabled={loading}
          aria-label="Sign in with Google"
        >
          {loading ? 'Please wait...' : 'Sign in with Google'}
        </button>
        {error && <p className="error-msg" role="alert">{error}</p>}
      </form>
    </div>
  );
};

export default LoginPage;
