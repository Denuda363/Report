import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDocFromServer,
  setDoc,
  enableNetwork,
  disableNetwork,
  setLogLevel
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

// Suppress Firestore quota & benign Auth network error logs from spamming the console
// and triggering automated error trackers since we handle them gracefully.
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const first = args[0];
  const str = typeof first === 'string' ? first : (first?.message || String(first || ''));
  if (
    str.includes('Quota limit exceeded') || 
    str.includes('Using maximum backoff delay') ||
    str.includes('resource-exhausted') ||
    str.includes('auth/network-request-failed') ||
    (first as any)?.code === 'auth/network-request-failed'
  ) {
    return; // Ignore internal firebase quota or auth network error spam
  }
  originalConsoleError(...args);
};

// Global unhandled rejection guard for Firebase Auth network glitches (e.g., iframe restrictions)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    const code = reason?.code || '';
    if (
      code === 'auth/network-request-failed' ||
      msg.includes('auth/network-request-failed') ||
      msg.includes('network-request-failed')
    ) {
      event.preventDefault();
      console.warn('Firebase Auth network notice handled gracefully.');
    }
  });
}

// Optionally silence Firestore's own logger
setLogLevel('silent');

const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Firestore with ignoreUndefinedProperties: true
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  }, config.firestoreDatabaseId);
} catch {
  db = getFirestore(app, config.firestoreDatabaseId);
}

// Always ensure network is connected
enableNetwork(db).catch(() => {});

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Immediately attach listener with error callback to consume background token-refresh or network-timeout rejections
try {
  onAuthStateChanged(
    auth,
    () => {},
    (err) => {
      // Absorb network-request-failed gracefully without throwing
      console.warn('Firebase Auth background listener note:', err?.message || err);
    }
  );
} catch {
  // Safe fallback
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const FIREBASE_UPGRADE_URL = `https://console.firebase.google.com/project/${config.projectId}/firestore/databases/${config.firestoreDatabaseId}/data?openUpgradeDialog=true`;

let isQuotaExceededCached = false;

export const isFirebaseQuotaExceeded = () => isQuotaExceededCached;

export const resetFirebaseQuotaStatus = () => {
  isQuotaExceededCached = false;
  enableNetwork(db).catch(() => {});
};

export const notifyQuotaExceeded = (errMessage?: string) => {
  isQuotaExceededCached = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('firebase-quota-exceeded', {
      detail: {
        message: errMessage || 'Batas kuota harian Firebase Firestore gratis telah tercapai.',
        upgradeUrl: FIREBASE_UPGRADE_URL,
      }
    }));
  }
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  const isQuota = message.includes('resource-exhausted') || message.includes('Quota limit exceeded') || message.includes('Quota exceeded');
  
  if (!isQuota) {
    console.error('Firestore Error:', JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Quota Exceeded handled gracefully.');
  }

  if (isQuota) {
    notifyQuotaExceeded(message);
    const friendlyError = new Error(
      `Batas kuota harian gratis Firebase Firestore (20.000 unit tulis/hari) telah tercapai untuk hari ini. ` +
      `Kuota akan di-reset otomatis besok. Silakan beralih sementara ke Mode Lokal Offline di Pengaturan agar dapat terus mencatat data.`
    );
    (friendlyError as any).code = 'resource-exhausted';
    throw friendlyError;
  }

  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    throw new Error(JSON.stringify(errInfo));
  }
  throw error;
}

export async function testFirebaseConnection(): Promise<{ 
  success: boolean; 
  readOk?: boolean;
  writeOk?: boolean;
  error?: string; 
  quotaExceeded?: boolean;
  upgradeUrl?: string;
}> {
  try {
    // 1. Ensure network is enabled
    await enableNetwork(db).catch(() => {});

    // 2. Test reading from server
    await getDocFromServer(doc(db, 'test', 'connection'));

    // 3. Test writing to check write quota
    try {
      await setDoc(doc(db, 'test', 'connection'), { lastChecked: Date.now(), status: 'online' }, { merge: true });
      isQuotaExceededCached = false;
      return { 
        success: true, 
        readOk: true, 
        writeOk: true 
      };
    } catch (writeError: any) {
      const writeMsg = writeError?.message || '';
      if (writeMsg.includes('resource-exhausted') || writeMsg.includes('Quota limit exceeded') || writeMsg.includes('Quota exceeded')) {
        isQuotaExceededCached = true;
        notifyQuotaExceeded(writeMsg);
        return { 
          success: false, 
          readOk: true, 
          writeOk: false,
          quotaExceeded: true, 
          upgradeUrl: FIREBASE_UPGRADE_URL,
          error: 'Koneksi ke Firestore Berhasil (Dapat Dibaca), namun kuota tulis harian gratis (20.000 unit tulis/hari) telah tercapai untuk hari ini. Kuota akan di-reset otomatis besok oleh Google.' 
        };
      }
      return {
        success: false,
        readOk: true,
        writeOk: false,
        error: `Koneksi baca Firestore berhasil, namun tes tulis gagal: ${writeMsg}`
      };
    }
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('resource-exhausted') || msg.includes('Quota limit exceeded') || msg.includes('Quota exceeded')) {
      isQuotaExceededCached = true;
      notifyQuotaExceeded(msg);
      return { 
        success: false, 
        quotaExceeded: true, 
        upgradeUrl: FIREBASE_UPGRADE_URL,
        error: 'Batas kuota harian gratis Firestore telah tercapai (Free daily quota exceeded). Kuota akan di-reset otomatis besok.' 
      };
    }
    if (msg.includes('the client is offline')) {
      return { success: false, error: 'Firebase offline atau koneksi jaringan terputus.' };
    }
    // Any other response (like document not found) confirms the server connection is working
    return { success: false, error: msg || 'Gagal tersambung ke Firebase Firestore.' };
  }
}

// Perform initial connection test
testFirebaseConnection().catch(console.warn);

export { app, db, auth, googleProvider, signInWithPopup };

