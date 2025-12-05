import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDqZcbgRV_XKh84Hz9XWoLi57OHJtSkWbI",
  authDomain: "my-ff-shop-352fd.firebaseapp.com",
  databaseURL: "https://my-ff-shop-352fd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-ff-shop-352fd",
  storageBucket: "my-ff-shop-352fd.firebasestorage.app",
  messagingSenderId: "1026791961950",
  appId: "1:1026791961950:web:b252f8efc0c17c59608bcf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export default app;