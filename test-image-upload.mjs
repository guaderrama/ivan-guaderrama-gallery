import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testImageUpload() {
  console.log('🧪 Iniciando prueba de carga de imágenes...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down so we can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`📱 [${type.toUpperCase()}] ${text}`);
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.error('❌ Page Error:', error.message);
  });

  try {
    // Step 1: Navigate to app
    console.log('1️⃣ Navegando a http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-load.png' });
    console.log('✅ App cargada correctamente\n');

    // Step 2: Check if user is logged in
    console.log('2️⃣ Verificando estado de autenticación...');
    const isLoginPage = await page.locator('text=Iniciar Sesión').count() > 0;

    if (isLoginPage) {
      console.log('⚠️  Usuario no autenticado. Intentando login...');

      // Fill login form
      await page.fill('input[type="email"]', 'arturoguaderrama@gmail.com');
      await page.fill('input[type="password"]', 'Unodos3$');
      await page.screenshot({ path: 'test-results/02-login-form.png' });

      await page.click('button:has-text("Iniciar Sesión")');
      await page.waitForTimeout(3000);

      // Check if login was successful
      const stillOnLogin = await page.locator('text=Iniciar Sesión').count() > 0;
      if (stillOnLogin) {
        console.error('❌ Login falló');
        await page.screenshot({ path: 'test-results/03-login-failed.png' });
        throw new Error('No se pudo autenticar');
      }

      console.log('✅ Login exitoso\n');
      await page.screenshot({ path: 'test-results/03-after-login.png' });
    } else {
      console.log('✅ Usuario ya autenticado\n');
    }

    // Step 3: Click "Agregar Obra" button
    console.log('3️⃣ Abriendo formulario de nueva obra...');
    await page.waitForSelector('button:has-text("Agregar Obra")', { timeout: 5000 });
    await page.click('button:has-text("Agregar Obra")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/04-form-opened.png' });
    console.log('✅ Formulario abierto\n');

    // Step 4: Fill basic form fields
    console.log('4️⃣ Llenando campos del formulario...');
    await page.fill('input[name="nombre"]', 'Obra de Prueba Playwright');
    await page.fill('input[name="sku"]', 'TEST-PLAYWRIGHT-' + Date.now());
    await page.fill('input[name="precio"]', '5000');
    await page.fill('textarea[name="descripcion"]', 'Esta es una obra de prueba creada con Playwright para verificar la integración con Firebase Storage.');

    // Fill dimensions
    await page.fill('input[name="dimensiones"]', '100x80x5');

    await page.screenshot({ path: 'test-results/05-form-filled.png' });
    console.log('✅ Campos básicos llenados\n');

    // Step 5: Upload image
    console.log('5️⃣ Probando carga de imagen...');

    // Create a test image file (1x1 pixel PNG)
    const testImagePath = join(__dirname, 'test-results', 'test-image.png');
    const fs = await import('fs');
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, pngData);

    // Click the upload button to trigger file input
    const fileInputPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Subir Imagen")');
    const fileChooser = await fileInputPromise;
    await fileChooser.setFiles(testImagePath);

    console.log('📤 Imagen seleccionada, esperando subida a Firebase Storage...');
    await page.waitForTimeout(3000); // Wait for upload

    // Check if upload button changed to "Cambiar Imagen"
    const uploadComplete = await page.locator('button:has-text("Cambiar Imagen")').count() > 0;
    if (uploadComplete) {
      console.log('✅ Imagen subida correctamente a Firebase Storage\n');
    } else {
      console.log('⚠️  Estado del botón no cambió, verificando errores...');
    }

    await page.screenshot({ path: 'test-results/06-image-uploaded.png' });

    // Step 6: Submit form
    console.log('6️⃣ Guardando obra...');
    await page.click('button:has-text("Guardar Producto")');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/07-after-submit.png' });

    // Step 7: Check for errors
    console.log('7️⃣ Verificando errores...');
    const errorVisible = await page.locator('text=Error de conexión').count() > 0;
    const firestoreError = await page.locator('text=longer than').count() > 0;

    if (errorVisible || firestoreError) {
      console.error('❌ ERROR ENCONTRADO: La obra no se pudo guardar');
      await page.screenshot({ path: 'test-results/08-error-detected.png' });

      // Check console for errors
      console.log('\n📋 Revisando consola del navegador para más detalles...');
    } else {
      console.log('✅ No se detectaron errores visibles');
      console.log('✅ La obra se guardó correctamente\n');
    }

    await page.screenshot({ path: 'test-results/09-final-state.png' });

    console.log('\n✅ Prueba completada. Screenshots guardados en test-results/');

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    await page.screenshot({ path: 'test-results/error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

// Run the test
testImageUpload().catch(console.error);
