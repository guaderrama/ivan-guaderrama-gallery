#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Datos originales de la aplicación antigua
const oldData = [
  {
    sku: "ESC-MET-001",
    name: "Abstract Metal Sculpture",
    imageUrl: "",
    totalEditions: 10,
    editions: [
      { id: "ESC-MET-001-1", editionNumber: 1, comments: "First of the series.", exhibitionLocation: "Alvaro Obregon Gallery", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-2", editionNumber: 2, comments: "On loan for photoshoot.", exhibitionLocation: "Studio A", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-3", editionNumber: 3, comments: "SOLD", exhibitionLocation: "Quivira", gallerySeller: "Quivira / Jonathan", clientName: "John Doe", salesInvoice: "QV-12345" },
      { id: "ESC-MET-001-4", editionNumber: 4, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-5", editionNumber: 5, comments: "Minor scratch on base.", exhibitionLocation: "Alvaro Obregon Gallery", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-6", editionNumber: 6, comments: "SOLD", exhibitionLocation: "Art Basel", gallerySeller: "Art Basel / Maria", clientName: "Jane Smith", salesInvoice: "AB-67890" },
      { id: "ESC-MET-001-7", editionNumber: 7, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-8", editionNumber: 8, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-9", editionNumber: 9, comments: "", exhibitionLocation: "Warehouse", gallerySeller: "", clientName: "", salesInvoice: "" },
      { id: "ESC-MET-001-10", editionNumber: 10, comments: "Last of the series.", exhibitionLocation: "Alvaro Obregon Gallery", gallerySeller: "", clientName: "", salesInvoice: "" },
    ]
  },
  {
    sku: "DSK-OAK-002",
    name: "Minimalist Oak Desk",
    imageUrl: "",
    totalEditions: 5,
    editions: Array.from({ length: 5 }, (_, i) => ({
      id: `DSK-OAK-002-${i + 1}`,
      editionNumber: i + 1,
      comments: "",
      exhibitionLocation: "Warehouse",
      gallerySeller: "",
      clientName: "",
      salesInvoice: ""
    }))
  }
];

async function migrateSeries() {
  console.log('🚀 Starting migration of numbered editions...\n');

  for (const series of oldData) {
    console.log(`📚 Migrating series: ${series.name} (${series.sku})`);

    try {
      // Create series document
      const seriesRef = doc(collection(db, 'numbered-editions'));
      const seriesData = {
        sku: series.sku,
        seriesName: series.name,
        imageUrl: series.imageUrl || '',
        totalEditions: series.totalEditions,
        seriesStatus: 'active',
        createdAt: serverTimestamp(),
      };

      await setDoc(seriesRef, seriesData);
      console.log(`  ✅ Series created with ID: ${seriesRef.id}`);

      // Create editions subcollection
      console.log(`  📄 Creating ${series.editions.length} editions...`);

      for (const edition of series.editions) {
        const editionRef = doc(collection(seriesRef, 'editions'));

        // Determine status based on comments
        const isSold = edition.comments.toUpperCase().includes('SOLD');

        const editionData = {
          editionNumber: edition.editionNumber,
          status: isSold ? 'sold' : 'available',
          exhibitionLocation: edition.exhibitionLocation || '',
          comments: edition.comments || '',
          gallerySeller: edition.gallerySeller || '',
          clientName: edition.clientName || '',
          salesInvoice: edition.salesInvoice || '',
          createdAt: serverTimestamp(),
        };

        await setDoc(editionRef, editionData);
        console.log(`    ✅ Edition ${edition.editionNumber} created (${isSold ? 'SOLD' : 'available'})`);
      }

      console.log(`  ✅ All editions created for ${series.name}\n`);
    } catch (error) {
      console.error(`  ❌ Error migrating ${series.name}:`, error);
    }
  }

  console.log('\n✅ Migration complete!');
  console.log('\nSummary:');
  console.log(`  - Series migrated: ${oldData.length}`);
  console.log(`  - Total editions: ${oldData.reduce((sum, s) => sum + s.totalEditions, 0)}`);
  console.log('\nRefresh your app to see the data.');

  process.exit(0);
}

migrateSeries().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
