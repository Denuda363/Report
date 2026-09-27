const fs = require('fs');
const file = 'src/lib/firebase.ts';
let code = fs.readFileSync(file, 'utf-8');

const replacement = `import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, disableNetwork } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

// Check if we are in local offline mode
const isLocalDb = localStorage.getItem('useLocalDb') === 'true';

if (isLocalDb) {
  // If in pure offline mode, stop Firebase from trying to connect and sync
  disableNetwork(db).catch(console.error);
} else {
  // Only enable persistence if we are using the cloud db
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider, signInWithPopup };
`;

fs.writeFileSync(file, replacement);
