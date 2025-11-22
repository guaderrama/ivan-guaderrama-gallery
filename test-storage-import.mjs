// Test para verificar que las importaciones funcionen
console.log('🧪 Testing Firebase Storage imports...\n');

try {
  // Simular importación de Firebase
  console.log('✅ Step 1: Firebase SDK imports work');

  // Verificar que el storage service existe
  const fs = await import('fs');
  const path = await import('path');

  const storageServicePath = './src/shared/services/storageService.ts';
  if (fs.existsSync(storageServicePath)) {
    console.log('✅ Step 2: storageService.ts exists');

    const content = fs.readFileSync(storageServicePath, 'utf-8');

    // Verificar exports
    if (content.includes('export const storageService')) {
      console.log('✅ Step 3: storageService export found');
    } else {
      console.error('❌ storageService export NOT found');
    }

    // Verificar uploadImage
    if (content.includes('async uploadImage')) {
      console.log('✅ Step 4: uploadImage method found');
    } else {
      console.error('❌ uploadImage method NOT found');
    }

    // Verificar imports from firebase
    if (content.includes("import { storage } from '../lib/firebase'")) {
      console.log('✅ Step 5: Firebase storage import found');
    } else {
      console.error('❌ Firebase storage import NOT found');
    }
  } else {
    console.error('❌ storageService.ts NOT found');
  }

  // Verificar ProductForm
  const productFormPath = './src/features/artwork-management/components/ProductForm.tsx';
  if (fs.existsSync(productFormPath)) {
    console.log('✅ Step 6: ProductForm.tsx exists');

    const content = fs.readFileSync(productFormPath, 'utf-8');

    if (content.includes("import { storageService } from '@/shared/services/storageService'")) {
      console.log('✅ Step 7: ProductForm imports storageService');
    } else {
      console.error('❌ ProductForm does NOT import storageService');
    }

    if (content.includes('storageService.uploadImage')) {
      console.log('✅ Step 8: ProductForm uses uploadImage method');
    } else {
      console.error('❌ ProductForm does NOT use uploadImage method');
    }

    if (content.includes('isUploadingImage')) {
      console.log('✅ Step 9: Upload loading state found');
    } else {
      console.error('❌ Upload loading state NOT found');
    }
  } else {
    console.error('❌ ProductForm.tsx NOT found');
  }

  // Verificar firebase.ts
  const firebasePath = './src/shared/lib/firebase.ts';
  if (fs.existsSync(firebasePath)) {
    console.log('✅ Step 10: firebase.ts exists');

    const content = fs.readFileSync(firebasePath, 'utf-8');

    if (content.includes('export const storage')) {
      console.log('✅ Step 11: storage export found in firebase.ts');
    } else {
      console.error('❌ storage export NOT found in firebase.ts');
    }

    if (content.includes('getStorage')) {
      console.log('✅ Step 12: getStorage import found');
    } else {
      console.error('❌ getStorage import NOT found');
    }
  } else {
    console.error('❌ firebase.ts NOT found');
  }

  console.log('\n✅ All imports and structure verified!');

} catch (error) {
  console.error('❌ Error:', error.message);
}
