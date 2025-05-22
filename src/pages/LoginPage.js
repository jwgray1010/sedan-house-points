// LoginPage.js - With Firestore Save, Google Sign-In Restriction, and Session Tracking
import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './LoginPage.css';
import glowingLogo from '../assets/glowing_logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const saveTeacher = async (user) => {
    const { displayName, email, uid } = user;
    await setDoc(doc(db, 'teachers', uid), {
      name: displayName || email.split('@')[0],
      email,
      uid
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.endsWith('@usd286.org')) {
      setError('❌ Only @usd286.org accounts allowed');
      return;
    }
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await saveTeacher(userCred.user);
      navigate('/dashboard');
    } catch (err) {
      setError('❌ Login failed: Check credentials');
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      if (!userEmail.endsWith('@usd286.org')) {
        setError('❌ Access denied: Use a @usd286.org email');
        auth.signOut();
        return;
      }
      await saveTeacher(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError('❌ Google Sign-In failed');
    }
  };

  return (
    <div className="login-container">
      <img src={glowingLogo} alt="Sedan Logo" className="login-logo" />
      <h2>Teacher Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <button type="button" onClick={handleGoogleSignIn} className="google-button">
          Sign in with Google
        </button>
        {error && <p className="error-msg">{error}</p>}
      </form>
    </div>
  );
};

export default LoginPage;
