# 🔄 Script de Recuperación de Datos - Ediciones Numeradas

## Instrucciones:

1. **Abre tu aplicación**: https://ivan-guaderrama-gallery.web.app
2. **Asegúrate de estar logueado** como admin
3. **Abre DevTools**: Presiona F12
4. **Ve a la pestaña Console**
5. **Copia y pega el siguiente script completo**
6. **Presiona Enter**

---

## 📋 Script de Recuperación:

```javascript
// Script para recuperar datos de Ediciones Numeradas
(async function() {
  console.log('🚀 Iniciando recuperación de datos...\n');

  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  const { getFirestore, collection, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

  const firebaseConfig = {
    apiKey: "AIzaSyDNH6Btw9Ntkhe2BZl4jPDW3RJq_U4EQFE",
    authDomain: "ivan-guaderrama-gallery.firebaseapp.com",
    projectId: "ivan-guaderrama-gallery",
    storageBucket: "ivan-guaderrama-gallery.firebasestorage.app",
    messagingSenderId: "416891532416",
    appId: "1:416891532416:web:85878393a8317079c5a265",
  };

  const app = initializeApp(firebaseConfig, 'recovery-app');
  const db = getFirestore(app);

  const oldData = [
    {
      sku: "ESC-MET-001",
      name: "Abstract Metal Sculpture",
      totalEditions: 10,
      editions: [
        { editionNumber: 1, comments: "First of the series.", exhibitionLocation: "Alvaro Obregon Gallery", status: "available" },
        { editionNumber: 2, comments: "On loan for photoshoot.", exhibitionLocation: "Studio A", status: "available" },
        { editionNumber: 3, comments: "SOLD", exhibitionLocation: "Quivira", gallerySeller: "Quivira / Jonathan", clientName: "John Doe", salesInvoice: "QV-12345", status: "sold" },
        { editionNumber: 4, comments: "", exhibitionLocation: "Warehouse", status: "available" },
        { editionNumber: 5, comments: "Minor scratch on base.", exhibitionLocation: "Alvaro Obregon Gallery", status: "available" },
        { editionNumber: 6, comments: "SOLD", exhibitionLocation: "Art Basel", gallerySeller: "Art Basel / Maria", clientName: "Jane Smith", salesInvoice: "AB-67890", status: "sold" },
        { editionNumber: 7, comments: "", exhibitionLocation: "Warehouse", status: "available" },
        { editionNumber: 8, comments: "", exhibitionLocation: "Warehouse", status: "available" },
        { editionNumber: 9, comments: "", exhibitionLocation: "Warehouse", status: "available" },
        { editionNumber: 10, comments: "Last of the series.", exhibitionLocation: "Alvaro Obregon Gallery", status: "available" },
      ]
    },
    {
      sku: "DSK-OAK-002",
      name: "Minimalist Oak Desk",
      totalEditions: 5,
      editions: Array.from({ length: 5 }, (_, i) => ({
        editionNumber: i + 1,
        comments: "",
        exhibitionLocation: "Warehouse",
        status: "available",
        gallerySeller: "",
        clientName: "",
        salesInvoice: ""
      }))
    }
  ];

  for (const series of oldData) {
    console.log(`📚 Recuperando: ${series.name} (${series.sku})`);

    try {
      const seriesRef = doc(collection(db, 'numbered-editions'));
      const seriesData = {
        sku: series.sku,
        seriesName: series.name,
        imageUrl: '',
        totalEditions: series.totalEditions,
        seriesStatus: 'active',
        createdAt: serverTimestamp(),
      };

      await setDoc(seriesRef, seriesData);
      console.log(`  ✅ Serie creada con ID: ${seriesRef.id}`);

      console.log(`  📄 Creando ${series.editions.length} ediciones...`);

      for (const edition of series.editions) {
        const editionRef = doc(collection(seriesRef, 'editions'));
        const editionData = {
          editionNumber: edition.editionNumber,
          status: edition.status,
          exhibitionLocation: edition.exhibitionLocation || '',
          comments: edition.comments || '',
          gallerySeller: edition.gallerySeller || '',
          clientName: edition.clientName || '',
          salesInvoice: edition.salesInvoice || '',
          createdAt: serverTimestamp(),
        };

        await setDoc(editionRef, editionData);
        console.log(`    ✅ Edición ${edition.editionNumber} (${edition.status})`);
      }

      console.log(`  ✅ ${series.name} completada\n`);
    } catch (error) {
      console.error(`  ❌ Error:`, error);
    }
  }

  console.log('\n✅ ¡Recuperación completa!');
  console.log('🔄 Recarga la página para ver los datos');
})();
```

---

## ✅ Resultado Esperado:

Deberías ver:
```
🚀 Iniciando recuperación de datos...
📚 Recuperando: Abstract Metal Sculpture (ESC-MET-001)
  ✅ Serie creada con ID: ...
  📄 Creando 10 ediciones...
    ✅ Edición 1 (available)
    ✅ Edición 2 (available)
    ✅ Edición 3 (sold)
    ...
  ✅ Abstract Metal Sculpture completada

📚 Recuperando: Minimalist Oak Desk (DSK-OAK-002)
  ✅ Serie creada con ID: ...
  ...

✅ ¡Recuperación completa!
🔄 Recarga la página para ver los datos
```

---

## 🔄 Después de ejecutar:

1. **Recarga la página**: `Ctrl + Shift + R`
2. **Ve a "Ediciones Numeradas"**
3. Deberías ver tus 2 series con todas sus ediciones

---

**Si hay algún error, cópialo y envíamelo.**
