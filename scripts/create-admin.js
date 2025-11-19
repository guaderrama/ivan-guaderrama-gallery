#!/usr/bin/env node

/**
 * Script para crear usuario admin en Firebase
 * Uso: node scripts/create-admin.js
 */

import admin from 'firebase-admin';

// Inicializar Firebase Admin con credenciales del proyecto
admin.initializeApp({
  projectId: 'ivan-guaderrama-gallery',
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  const email = 'obrgaleria@ivanguaderrama.com';
  const password = 'QMgep809';

  try {
    console.log('🔄 Creando usuario en Firebase Authentication...');

    // Crear usuario en Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false,
    });

    console.log('✅ Usuario creado en Authentication');
    console.log('   UID:', userRecord.uid);
    console.log('   Email:', userRecord.email);

    // Crear documento en Firestore con rol admin
    console.log('\n🔄 Asignando rol admin en Firestore...');

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Rol admin asignado en Firestore');
    console.log('\n🎉 Usuario admin creado exitosamente!');
    console.log('\n📝 Credenciales:');
    console.log('   Email:', email);
    console.log('   Password: QMgep809');
    console.log('   Role: admin');
    console.log('   UID:', userRecord.uid);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error.message);

    // Si el usuario ya existe, solo actualizar el rol
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️  El usuario ya existe. Intentando actualizar rol...');
      try {
        const userRecord = await auth.getUserByEmail(email);
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: userRecord.email,
          role: 'admin',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log('✅ Rol admin actualizado exitosamente');
        console.log('   UID:', userRecord.uid);
        process.exit(0);
      } catch (updateError) {
        console.error('❌ Error al actualizar rol:', updateError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

// Ejecutar
createAdminUser();
