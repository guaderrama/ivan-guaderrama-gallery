#!/usr/bin/env node

/**
 * Script to update Firestore security rules using Google Cloud REST API
 * This script reads firestore.rules and updates them in the Firebase project
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'ivan-guaderrama-gallery';

async function getAccessToken() {
  // Try to get access token from gcloud
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec('gcloud auth print-access-token', (error, stdout, stderr) => {
      if (error) {
        reject(new Error('Failed to get access token. Please run: gcloud auth login'));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function updateFirestoreRules(accessToken) {
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  const payload = JSON.stringify({
    source: {
      files: [
        {
          content: rulesContent,
          name: 'firestore.rules'
        }
      ]
    }
  });

  const options = {
    hostname: 'firebaserules.googleapis.com',
    port: 443,
    path: `/v1/projects/${PROJECT_ID}/releases?releaseId=cloud.firestore`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Firestore rules updated successfully!');
          resolve(JSON.parse(data));
        } else {
          console.error('❌ Failed to update rules');
          console.error('Status:', res.statusCode);
          console.error('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Getting access token...');
    const accessToken = await getAccessToken();

    console.log('📤 Updating Firestore rules...');
    await updateFirestoreRules(accessToken);

    console.log('✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('\n📝 Manual steps:');
    console.error('1. Go to https://console.firebase.google.com/');
    console.error('2. Select project: ivan-guaderrama-gallery');
    console.error('3. Go to Firestore Database > Rules');
    console.error('4. Copy content from firestore.rules file');
    console.error('5. Click "Publish"');
    process.exit(1);
  }
}

main();
