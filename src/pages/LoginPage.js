import React, { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const navigate = useNavigate();

  // Focus email input on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // Auth state check — fixed loop issue
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        navigate('/dashboard');
      }
    });
    return unsubscribe;
  }, [navigate]);

  // Save teacher info to Firestore
  const saveTeacher = async (user) => {
    const { displayName, email, uid } = user;
    await setDoc(doc(db, 'teachers', uid), {
      name: displayName || email.split('@')[0],
      email,
      uid
    });
  };

  // Email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
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
    } catch {
      setError('❌ Login failed: Check credentials');
    }

    setLoading(false);
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
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
    } catch {
      setError('❌ Google Sign-In failed');
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Teacher Login</h2>

      {/* You can re-enable this once the image works */}
      {/* <img src={glowingLogo} alt="Sedan Logo" style={{ width: 100, marginBottom: 20 }} /> */}

      <form onSubmit={handleLogin}>
        <input
          ref={emailRef}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.5rem' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          marginTop: '1rem',
          width: '100%',
          padding: '0.5rem',
          backgroundColor: '#4285F4',
          color: '#fff',
          border: 'none'
        }}
      >
        {loading ? 'Please wait...' : 'Sign in with Google'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
};

export default LoginPage;