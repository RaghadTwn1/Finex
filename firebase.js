// Firebase configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDj1QrzIN3kYkosUG45R5N1LKFIuH_S4q8",
  authDomain: "finex-caa0a.firebaseapp.com",
  projectId: "finex-caa0a",
  storageBucket: "finex-caa0a.firebasestorage.app",
  messagingSenderId: "585723825593",
  appId: "1:585723825593:web:ec60351cdd3901398f3a68",
  measurementId: "G-K1DVLX1T4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export Firestore
export { db };