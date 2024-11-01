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
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB2R6bNoBAdk9C4rvxDVu5ipEBLqu7JGjw',
  authDomain: 'green-car-4a273.firebaseapp.com',
  projectId: 'green-car-4a273',
  storageBucket: 'green-car-4a273.appspot.com',
  messagingSenderId: '715460877679',
  appId: '1:715460877679:web:9596b97ab4d13555195c9a',
  measurementId: 'G-9JJ02D0Q7G',
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
}

// You can also export your own functions here if needed
console.log('Welcome to Vite + JS + Webflow!')
