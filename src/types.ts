export interface Supplier {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  supplierId: string;
  unit: string;
}

export interface ReportEntry {
  id: string;
  date: string; // YYYY-MM-DD
  productId: string;
  quantity: number;
}
