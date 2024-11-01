// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  startAfter,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBPCuTbe_orOYXdKX_FofLprfaeIXRaPQY',

  authDomain: 'greenvcm.firebaseapp.com',

  projectId: 'greenvcm',

  storageBucket: 'greenvcm.firebasestorage.app',

  messagingSenderId: '991889556349',

  appId: '1:991889556349:web:9e4ae6b1f7818f4466c214',

  measurementId: 'G-35W6G7W6PJ',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const firestore = getFirestore(app)
const storage = getStorage(app)

// Export Firebase variables and functions
export {
  app,
  auth,
  firestore,
  storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  doc,
  setDoc,
  getDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  onSnapshot,
  startAfter,
}

// You can also export your own functions here if needed
console.log('Welcome to Vite + JS + Webflow!')
