import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firestore';

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

console.log('Checking series collection...');

const seriesRef = collection(db, 'numbered-series');
const snapshot = await getDocs(seriesRef);

console.log(`Found ${snapshot.size} documents in numbered-series collection`);

snapshot.forEach(doc => {
  console.log(`Series ID: ${doc.id}`);
  console.log('Data:', doc.data());
});
