import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''
};

function hasConfig() {
  return Boolean(config.apiKey && config.authDomain && config.projectId);
}

export function getFirebaseApp() {
  if (!hasConfig()) {
    return null;
  }
  if (!getApps().length) {
    initializeApp(config);
  }
  return getApps()[0]!;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}
