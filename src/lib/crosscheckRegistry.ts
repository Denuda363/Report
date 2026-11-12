/**
 * Crosscheck Persistence Registry
 * Menyimpan status ceklis crosscheck secara persisten di localStorage
 * sebagai lapisan pengaman ganda agar status ceklis TIDAK PERNAH HILANG
 * saat halaman di-refresh, bahkan ketika koneksi database sedang lambat atau offline.
 */

const STORAGE_KEY = 'daily_report_crosscheck_registry_v1';

export interface CrosscheckRecord {
  isChecked: boolean;
  checkedAt?: number | null;
  checkedBy?: string | null;
  date?: string;
  productId?: string;
}

export const getCrosscheckRegistry = (): Record<string, CrosscheckRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveCrosscheckStatus = (
  id: string, 
  isChecked: boolean, 
  checkedAt?: number | null, 
  checkedBy?: string | null,
  date?: string,
  productId?: string
) => {
  if (typeof window === 'undefined' || !id) return;
  try {
    const registry = getCrosscheckRegistry();
    const rec: CrosscheckRecord = {
      isChecked: Boolean(isChecked),
      checkedAt: isChecked ? (checkedAt || Date.now()) : null,
      checkedBy: checkedBy || null,
      date,
      productId
    };
    registry[id] = rec;
    if (date && productId) {
      registry[`${date}_${productId}`] = rec;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('[CrosscheckRegistry] Gagal menyimpan ke localStorage:', e);
  }
};

export const saveCrosscheckBatch = (
  items: { id: string; isChecked: boolean; checkedAt?: number | null; date?: string; productId?: string }[]
) => {
  if (typeof window === 'undefined' || !items.length) return;
  try {
    const registry = getCrosscheckRegistry();
    const now = Date.now();
    for (const item of items) {
      if (!item.id) continue;
      const rec: CrosscheckRecord = {
        isChecked: Boolean(item.isChecked),
        checkedAt: item.isChecked ? (item.checkedAt || now) : null,
        checkedBy: null,
        date: item.date,
        productId: item.productId
      };
      registry[item.id] = rec;
      if (item.date && item.productId) {
        registry[`${item.date}_${item.productId}`] = rec;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('[CrosscheckRegistry] Gagal simpan batch:', e);
  }
};

export const mergeCrosscheckStatus = <T extends { id?: string; date?: string; productId?: string; isChecked?: boolean; checkedAt?: number | null }>(
  reports: T[]
): T[] => {
  const registry = getCrosscheckRegistry();
  const hasRegistry = Object.keys(registry).length > 0;

  return reports.map(r => {
    // 1. Jika di data asli database sudah tertera isChecked: true, prioritaskan dan sinkronkan ke local registry
    if (r.isChecked) {
      if (r.id && !registry[r.id]?.isChecked) {
        saveCrosscheckStatus(r.id, true, r.checkedAt, undefined, r.date, r.productId);
      }
      return r;
    }

    // 2. Jika di database belum tertera isChecked: true (misal baru saja dicek dan direfresh cepat),
    // cek apakah ada di local crosscheck registry
    if (hasRegistry) {
      const byId = r.id ? registry[r.id] : undefined;
      const byKey = (r.date && r.productId) ? registry[`${r.date}_${r.productId}`] : undefined;
      const stored = byId || byKey;

      if (stored && stored.isChecked) {
        return {
          ...r,
          isChecked: true,
          checkedAt: stored.checkedAt || r.checkedAt || Date.now()
        };
      }
    }

    return r;
  });
};
