// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACxndECKulnDX9zB-a34InRcKBTSqXRDE",
  authDomain: "sedan-house-points-86005.firebaseapp.com",
  databaseURL: "https://sedan-house-points-86005-default-rtdb.firebaseio.com",
  projectId: "sedan-house-points-86005",
  storageBucket: "sedan-house-points-86005.appspot.com", // 🔧 fixed typo here
  messagingSenderId: "17383841264",
  appId: "1:17383841264:web:a4eae8eeb840dca06cd135"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
