import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCXHe6PQ9TLC4HRxoKajsHzW5yhrHVpdg",
  authDomain: "eeff-connect.firebaseapp.com",
  projectId: "eeff-connect",
  storageBucket: "eeff-connect.firebasestorage.app",
  messagingSenderId: "849307700028",
  appId: "1:849307700028:web:26e637dd202285a37dac39",
  measurementId: "G-J6DXJWGF5B",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);