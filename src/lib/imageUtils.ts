/**
 * Utility to validate, resize, and optimize uploaded company logo/icon images
 * into a lightweight PNG Data URL suitable for Firestore, Supabase, IndexedDB, and PDF export.
 */
export const processCompanyIconFile = (file: File, maxSizePx = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (PNG, JPG, WebP, GIF, atau SVG).'));
      return;
    }

    const MAX_RAW_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_RAW_BYTES) {
      reject(new Error('Ukuran file gambar terlalu besar (maksimal 5 MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));

    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      if (!rawDataUrl) {
        reject(new Error('Data gambar kosong.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width || maxSizePx;
          const height = img.naturalHeight || img.height || maxSizePx;
          const scale = Math.min(1, maxSizePx / Math.max(width, height));
          const targetW = Math.max(1, Math.round(width * scale));
          const targetH = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);

          // Export as PNG so transparency is preserved and jsPDF supports it cleanly
          const optimized = canvas.toDataURL('image/png', 0.92);
          resolve(optimized);
        } catch {
          if (rawDataUrl.length <= 250000) {
            resolve(rawDataUrl);
          } else {
            reject(new Error('Gagal memproses gambar. Coba gunakan gambar dengan ukuran lebih kecil.'));
          }
        }
      };

      img.onerror = () => {
        if (file.type === 'image/svg+xml' && rawDataUrl.length <= 120000) {
          resolve(rawDataUrl);
        } else {
          reject(new Error('Format gambar tidak dapat diproses oleh browser.'));
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
};
