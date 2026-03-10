import {
  cert,
  getApps,
  initializeApp,
  type App as FirebaseAdminApp,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

const projectId =
  process.env.FB_ADMIN_PROJECT_ID?.trim() ||
  process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail =
  process.env.FB_ADMIN_CLIENT_EMAIL?.trim() ||
  process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = (
  process.env.FB_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || ""
).replace(/\\n/g, "\n").replace(/"/g, "").trim();
const firestoreDatabaseId =
  process.env.FB_FIRESTORE_DATABASE_ID?.trim() ||
  process.env.FIREBASE_FIRESTORE_DATABASE_ID?.trim();

export const hasFirebaseAdminConfig = Boolean(
  projectId && clientEmail && privateKey,
);

let adminApp: FirebaseAdminApp | null = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;
let adminStorage: Storage | null = null;

if (hasFirebaseAdminConfig) {
  adminApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

  if (firestoreDatabaseId) {
    adminDb = getFirestore(adminApp, firestoreDatabaseId);
  } else {
    adminDb = getFirestore(adminApp);
  }
  try {
    adminDb.settings({ ignoreUndefinedProperties: true });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("Firestore has already been initialized")
    ) {
      throw error;
    }
  }
  adminAuth = getAuth(adminApp);
  adminStorage = getStorage(adminApp);
} else if (process.env.NODE_ENV !== "test") {
  console.warn(
    "[firebase-admin] Missing Firebase admin env vars. Firestore server writes are disabled.",
  );
}

export { adminApp, adminDb, adminAuth, adminStorage };
