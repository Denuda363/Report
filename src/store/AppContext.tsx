import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, ReportEntry, Supplier } from '../types';
import { db, auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AppState {
  suppliers: Supplier[];
  products: Product[];
  reports: ReportEntry[];
  loading: boolean;
}

interface AppContextType extends AppState {
  userId: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addReport: (report: Omit<ReportEntry, 'id'>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;

  importMasterData: (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string }[]
  ) => Promise<void>;
  
  resetAllData: () => Promise<void>;
}

const defaultState: AppState = {
  suppliers: [],
  products: [],
  reports: [],
  loading: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Sign in failed", e);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    if (!userId) {
      setState(defaultState);
      return;
    }

    const suppliersRef = collection(db, 'suppliers');
    const productsRef = collection(db, 'products');
    const reportsRef = collection(db, 'reports');

    const qSuppliers = query(suppliersRef, where('userId', '==', userId));
    const qProducts = query(productsRef, where('userId', '==', userId));
    const qReports = query(reportsRef, where('userId', '==', userId));

    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setState(prev => ({ ...prev, suppliers }));
    });

    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setState(prev => ({ ...prev, products }));
    });

    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReportEntry));
      setState(prev => ({ ...prev, reports }));
    });

    // Assume loading completes once listeners attach (simple approximation)
    setState(prev => ({ ...prev, loading: false }));

    return () => {
      unsubSuppliers();
      unsubProducts();
      unsubReports();
    };
  }, [userId]);

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (!userId) return;
    await addDoc(collection(db, 'suppliers'), { ...supplier, userId });
  };

  const updateSupplier = async (supplier: Supplier) => {
    if (!userId) return;
    const { id, ...data } = supplier;
    await updateDoc(doc(db, 'suppliers', id), data);
  };

  const deleteSupplier = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'suppliers', id));
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!userId) return;
    await addDoc(collection(db, 'products'), { ...product, userId });
  };

  const updateProduct = async (product: Product) => {
    if (!userId) return;
    const { id, ...data } = product;
    await updateDoc(doc(db, 'products', id), data);
  };

  const deleteProduct = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'products', id));
  };

  const addReport = async (report: Omit<ReportEntry, 'id'>) => {
    if (!userId) return;
    await addDoc(collection(db, 'reports'), { ...report, userId });
  };

  const deleteReport = async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'reports', id));
  };

  const importMasterData = async (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string }[]
  ) => {
    if (!userId) return;

    try {
      // In a real app we'd batch, but for simplicity we'll process sequentially
      const supplierMap = new Map(state.suppliers.map(s => [s.name.toLowerCase().trim(), s.id]));
      const addedSuppliers = new Map<string, string>(); // new ones

      for (const ns of newSuppliers) {
        const key = ns.name.toLowerCase().trim();
        if (!supplierMap.has(key) && !addedSuppliers.has(key)) {
          const docRef = await addDoc(collection(db, 'suppliers'), { name: ns.name, userId });
          addedSuppliers.set(key, docRef.id);
        }
      }

      for (const np of newProducts) {
        const key = np.supplierName.toLowerCase().trim();
        if (!supplierMap.has(key) && !addedSuppliers.has(key)) {
          const docRef = await addDoc(collection(db, 'suppliers'), { name: np.supplierName, userId });
          addedSuppliers.set(key, docRef.id);
        }
      }

      for (const np of newProducts) {
        const key = np.supplierName.toLowerCase().trim();
        const supplierId = supplierMap.get(key) || addedSuppliers.get(key);
        
        if (supplierId) {
          const existsIndex = state.products.findIndex(p => p.name.toLowerCase().trim() === np.name.toLowerCase().trim() && p.supplierId === supplierId);
          if (existsIndex === -1) {
            await addDoc(collection(db, 'products'), {
              name: np.name,
              unit: np.unit,
              supplierId: supplierId,
              userId
            });
          }
        }
      }
    } catch (e) {
      console.error("Import failed:", e);
    }
  };

  const resetAllData = async () => {
    if (!userId) return;
    try {
      // Chunk deletions if there are more than 500 records overall
      // But for simplicity in this case, we use Promise.all which handles any size.
      const supplierPromises = state.suppliers.map(s => deleteDoc(doc(db, 'suppliers', s.id)));
      const productPromises = state.products.map(p => deleteDoc(doc(db, 'products', p.id)));
      const reportPromises = state.reports.map(r => deleteDoc(doc(db, 'reports', r.id)));
      
      await Promise.all([...supplierPromises, ...productPromises, ...reportPromises]);
    } catch (e) {
      console.error("Reset data failed:", e);
    }
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#F9FAF6]"><p className="text-[#8B9D77] font-bold">Loading...</p></div>;
  }

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAF6]">
        <div className="bg-white p-8 rounded-3xl border border-[#E2E4D8] shadow-sm max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-[#2D3025] mb-2">Welcome Back</h1>
          <p className="text-[#7A7F6E] mb-6">Please sign in to access your dashboard.</p>
          <button 
            onClick={signIn}
            className="w-full py-3 px-4 bg-[#8B9D77] hover:bg-[#728261] text-white rounded-2xl font-bold transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      ...state,
      userId, signIn, logout,
      addSupplier, updateSupplier, deleteSupplier,
      addProduct, updateProduct, deleteProduct,
      addReport, deleteReport, importMasterData,
      resetAllData
    }}>
      {!state.loading && children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
