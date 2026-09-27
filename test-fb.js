import { initializeApp } from "firebase/app";
import { getFirestore, doc, collection } from "firebase/firestore";
const app = initializeApp({ projectId: "test" });
const db = getFirestore(app);
try {
  doc(db, 'reports', undefined);
} catch (e) {
  console.error("ERROR:", e.message);
}
