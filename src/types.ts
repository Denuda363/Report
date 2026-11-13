export interface Supplier {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  supplierId: string;
  alternativeSupplierIds?: string[];
  unit: string;
  bottomStock?: number;
  isKosongPabrik?: boolean;
  kosongPabrikDate?: number;
  stock?: number;
  location?: string;
  category?: string;
}

export interface ReportEntry {
  id: string;
  date: string; // YYYY-MM-DD
  productId: string;
  quantity: number;
  createdAt?: number;
  isOrdered?: boolean;
  isArrived?: boolean;
  isKosongPabrik?: boolean;
  isReorder?: boolean;
  reorderQty?: number;
  reorderReason?: string;
  notes?: string;
  isWarningStock?: boolean;
  isArrivedOnly?: boolean;
  arrivedAt?: number;
  arrivedSupplierId?: string;
  arrivedQty?: number;
  isChecked?: boolean;
  checkedAt?: number;
  checkedBy?: string;
}

export interface StockOutEntry {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  notes?: string;
  createdAt: number;
  userId: string;
}

export interface NearExpiredEntry {
  id: string;
  productId?: string;
  productName: string;
  batch: string;
  expiredDate: string; // YYYY-MM-DD
  supplierId?: string;
  supplierName: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  createdAt: number;
  status?: 'pending' | 'returned' | 'disposed' | 'resolved';
}

export type AutoDeleteMode = 
  | 'none' 
  | 'keep_today' 
  | 'keep_2_days' 
  | 'keep_3_days' 
  | 'keep_7_days' 
  | 'keep_14_days' 
  | 'keep_30_days' 
  | 'custom';

export type NavbarPosition = 'bottom' | 'left' | 'right';
export type DbProvider = 'supabase' | 'firebase' | 'local';

export interface ChatUser {
  id: string;
  displayName: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: number;
  read: boolean;
}

export interface UserSettings {
  autoDeleteMode: AutoDeleteMode;
  autoDeleteDays?: number; // Custom retention days when mode is 'custom' or specified
  navbarPosition?: NavbarPosition;
  theme?: string;
  useLocalDb?: boolean;
  dbProvider?: DbProvider;
  supabaseUrl?: string;
  supabaseKey?: string;
  dbPinHash?: string;
}
