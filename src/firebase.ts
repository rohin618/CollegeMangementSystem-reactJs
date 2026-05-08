// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const hostname = window.location.hostname;

const UAT_HOSTS = [
  "localhost",
  "127.0.0.1",
  "ashtoncare-arm.vercel.app",
];

const isUAT = UAT_HOSTS.includes(hostname);

const firebaseConfig = isUAT
  ? {
    // ✅ UAT CONFIG
    apiKey: "AIzaSyBvzwKejIfqfuiofP_cm9QQrkft7s2c",
    authDomain: "ashtonuaapp.com",
    projectId: "ashtonuat-a9",
    storageBucket: "ashton9.firebasestorage.app",
    messagingSenderId: "53869482",
    appId: "1:5386705999caaeabbb51d27bf4a3",
    measurementId: "G-3HPD9E"
  }
  : {
    // ✅ PROD CONFIG
    apiKey: "AIzaSyDOZTNMOmqNd2Yyn8WiisjGUyA",
    authDomain: "arma-d.firebaseapp.com",
    projectId: "arma-de",
    storageBucket: "arma-11.firebasestorage.app",
    messagingSenderId: "lsdf",
    appId: "1:6176066970web:e926142ab4015882e4b5",
    measurementId: "G-QM55"
  };

// ✅ Initialize Firebase ONCE
const app = initializeApp(firebaseConfig);

// ✅ Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
