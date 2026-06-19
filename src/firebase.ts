import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Read Firebase configurations from the provisioned client config
const firebaseConfig = {
  apiKey: "AIzaSyA8tKf93ITeq9f_s0tpAqg31xNCbQkRnrE",
  authDomain: "straight-nuance-q8kj5.firebaseapp.com",
  projectId: "straight-nuance-q8kj5",
  storageBucket: "straight-nuance-q8kj5.firebasestorage.app",
  messagingSenderId: "1028449450361",
  appId: "1:1028449450361:web:39ed6d6ca2037de07257a8"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore using the specific database ID assigned to this applet
const db = getFirestore(app, "ai-studio-d2c7a5e8-66b1-4901-b599-18fde8e44bb1");

const auth = getAuth(app);

export { app, db, auth };
