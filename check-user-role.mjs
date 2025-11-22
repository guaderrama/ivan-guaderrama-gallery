import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDNH6Btw9Ntkhe2BZl4jPDW3RJq_U4EQFE",
  authDomain: "ivan-guaderrama-gallery.firebaseapp.com",
  projectId: "ivan-guaderrama-gallery",
  storageBucket: "ivan-guaderrama-gallery.firebasestorage.app",
  messagingSenderId: "416891532416",
  appId: "1:416891532416:web:85878393a8317079c5a265",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Este es el UID del usuario obrgaleria@ivanguaderrama.com
// Lo necesitamos para verificar su rol
console.log("Verificando usuario en Firestore...");

// Primero necesitamos obtener el UID del usuario
// Vamos a asumir que el UID está en algún documento
