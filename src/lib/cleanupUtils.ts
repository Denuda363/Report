import { AutoDeleteMode } from '../types';

export interface CleanupCutoffInfo {
  cutoffDateStr: string; // YYYY-MM-DD
  retentionDays: number;
  description: string;
  formattedCutoffDate: string;
}

export interface AutoDeletePreset {
  id: AutoDeleteMode;
  label: string;
  badge: string;
  days: number | null;
  description: string;
}

export const AUTO_DELETE_PRESETS: AutoDeletePreset[] = [
  {
    id: 'none',
    label: 'Nonaktif',
    badge: 'Selamanya',
    days: null,
    description: 'Semua data laporan disimpan selamanya tanpa pembersihan otomatis.'
  },
  {
    id: 'keep_today',
    label: 'Hari Ini',
    badge: '1 Hari',
    days: 1,
    description: 'Hanya menyimpan laporan hari ini. Laporan kemarin dan sebelumnya dibersihkan.'
  },
  {
    id: 'keep_2_days',
    label: '2 Hari',
    badge: '2 Hari Terakhir',
    days: 2,
    description: 'Menyimpan laporan hari ini dan kemarin. Data lebih dari 2 hari dibersihkan.'
  },
  {
    id: 'keep_3_days',
    label: '3 Hari',
    badge: '3 Hari Terakhir',
    days: 3,
    description: 'Menyimpan laporan 3 hari terakhir (hari ini, kemarin, dan 2 hari lalu).'
  },
  {
    id: 'keep_7_days',
    label: '7 Hari',
    badge: '1 Minggu',
    days: 7,
    description: 'Menyimpan laporan selama 7 hari terakhir (1 minggu).'
  },
  {
    id: 'keep_14_days',
    label: '14 Hari',
    badge: '2 Minggu',
    days: 14,
    description: 'Menyimpan laporan selama 14 hari terakhir (2 minggu).'
  },
  {
    id: 'keep_30_days',
    label: '30 Hari',
    badge: '1 Bulan',
    days: 30,
    description: 'Menyimpan laporan selama 30 hari terakhir (1 bulan).'
  },
  {
    id: 'custom',
    label: 'Kustom Hari',
    badge: 'Bebas Atur',
    days: null,
    description: 'Tentukan bebas berapa hari data laporan yang ingin Anda pertahankan.'
  }
];

export function getRetentionDays(mode: AutoDeleteMode, customDays?: number): number | null {
  if (mode === 'none') return null;
  if (mode === 'keep_today') return 1;
  if (mode === 'keep_2_days') return 2;
  if (mode === 'keep_3_days') return 3;
  if (mode === 'keep_7_days') return 7;
  if (mode === 'keep_14_days') return 14;
  if (mode === 'keep_30_days') return 30;
  if (mode === 'custom') {
    const val = Number(customDays);
    return !isNaN(val) && val >= 1 ? Math.floor(val) : 3;
  }
  return null;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${days[date.getDay()]}, ${day} ${months[date.getMonth()]} ${year}`;
  } catch {
    return dateStr;
  }
}

export function getCleanupCutoffDate(mode: AutoDeleteMode, customDays?: number): CleanupCutoffInfo | null {
  const days = getRetentionDays(mode, customDays);
  if (days === null) return null;

  const today = new Date();
  const cutoffDate = new Date(today);
  // Retaining `days` including today:
  // Day 1 = today (diff 0)
  // Day 2 = yesterday (diff 1)
  // Day N = today - (N - 1)
  cutoffDate.setDate(today.getDate() - (days - 1));

  // Local date ISO YYYY-MM-DD
  const cutoffDateStr = new Date(cutoffDate.getTime() - cutoffDate.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  const formattedCutoffDate = formatDateIndo(cutoffDateStr);

  let description = '';
  if (days === 1) {
    description = `Hanya laporan hari ini yang dipertahankan. Laporan sebelum ${formattedCutoffDate} dibersihkan.`;
  } else {
    description = `Laporan ${days} hari terakhir dipertahankan (mulai ${formattedCutoffDate} s/d Hari ini). Laporan sebelum tanggal tersebut dibersihkan.`;
  }

  return {
    cutoffDateStr,
    retentionDays: days,
    description,
    formattedCutoffDate
  };
}
