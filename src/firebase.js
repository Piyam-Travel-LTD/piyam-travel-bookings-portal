import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4DCG4vo7tbnp5cxTioFGCaTKVC0UQYQc",
  authDomain: "piyam-travel-bookings.firebaseapp.com",
  projectId: "piyam-travel-bookings",
  storageBucket: "piyam-travel-bookings.appspot.com",
  messagingSenderId: "186299516201",
  appId: "1:186299516201:web:d108cf1441bb811648a338",
  measurementId: "G-4L6QNY50NT"
};

// Initialize Firebase and export the services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
