import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDTvWytLFYH9pqTCT36VCbOEbJ0G_1FYGA",
  authDomain: "fear2hear.firebaseapp.com",
  projectId: "fear2hear",
  storageBucket: "fear2hear.firebasestorage.app",
  messagingSenderId: "882684741509",
  appId: "1:882684741509:web:7dead6d585a9d3bb12a6ec",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);