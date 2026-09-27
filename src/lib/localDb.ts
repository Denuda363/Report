import localforage from 'localforage';
import { Supplier, Product, ReportEntry, StockOutEntry, UserSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

localforage.config({
  name: 'DailyReportPro'
});

export const localDb = {
  suppliers: localforage.createInstance({ name: 'DailyReportPro', storeName: 'suppliers' }),
  products: localforage.createInstance({ name: 'DailyReportPro', storeName: 'products' }),
  reports: localforage.createInstance({ name: 'DailyReportPro', storeName: 'reports' }),
  stockOuts: localforage.createInstance({ name: 'DailyReportPro', storeName: 'stock_outs' }),
  settings: localforage.createInstance({ name: 'DailyReportPro', storeName: 'settings' })
};

export const generateId = () => uuidv4();
