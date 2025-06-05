// src/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: For production, move config to environment variables for security.
const firebaseConfig = {
  apiKey: "AIzaSyACxndECKulnDX9zB-a34InRcKBTSqXRDE",
  authDomain: "sedan-house-points-86005.firebaseapp.com",
  databaseURL: "https://sedan-house-points-86005-default-rtdb.firebaseio.com",
  projectId: "sedan-house-points-86005",
  storageBucket: "sedan-house-points-86005.appspot.com",
  messagingSenderId: "17383841264",
  appId: "1:17383841264:web:a4eae8eeb840dca06cd135"
};

// Prevent re-initialization in hot-reload/dev environments
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
