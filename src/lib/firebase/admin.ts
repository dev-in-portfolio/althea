import 'server-only';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function formatPrivateKey(key?: string) {
  if (!key) return '';
  return key.replace(/\\n/g, '\n');
}

export function getAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY)
      })
    });
  }
  return getAuth();
}
