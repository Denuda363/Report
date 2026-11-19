import { ClockStyle } from '../types';

export interface ClockStyleMeta {
  id: ClockStyle;
  name: string;
  description: string;
  badge: string;
  recommendedThemes: string[];
}

export const CLOCK_STYLE_OPTIONS: ClockStyleMeta[] = [
  {
    id: '3d-blocks',
    name: '3D Blok Taktil',
    description: 'Tombol angka 3D berbevel mengikuti palet tema aktif.',
    badge: 'Klasik 3D',
    recommendedThemes: ['default', 'green', 'ubuntu']
  },
  {
    id: 'analog-hybrid',
    name: 'Analog + Digital',
    description: 'Dial jam analog jarum detik live berpadu jam digital presisi.',
    badge: 'Hybrid Live',
    recommendedThemes: ['blue']
  },
  {
    id: 'luxury-gold',
    name: 'Eksekutif Emas',
    description: 'Latar obsidian mewah dengan angka aksen emas sampanye.',
    badge: 'Mewah',
    recommendedThemes: ['rose']
  },
  {
    id: 'nixie-tube',
    name: 'Tabung Nixie Hangat',
    description: 'Nuansa tabung filamen hangat retro dengan pendar amber.',
    badge: 'Vintage',
    recommendedThemes: ['amber']
  },
  {
    id: 'cyber-neon',
    name: 'Cyber OLED Neon',
    description: 'Layar gelap kontras tinggi dengan gradien angka neon modern.',
    badge: 'Futuristik',
    recommendedThemes: ['purple']
  },
  {
    id: 'minimal-swiss',
    name: 'Minimalis Swiss',
    description: 'Tipografi presisi bersih tanpa bingkai berlebih.',
    badge: 'Clean',
    recommendedThemes: ['cyan']
  },
  {
    id: 'prism-pop',
    name: 'Prisma Warna 3D',
    description: 'Setiap unit jam, menit, dan detik tampil dengan gradasi warna cerah.',
    badge: 'Colorful',
    recommendedThemes: ['colorful']
  },
  {
    id: 'flip-retro',
    name: 'Flip Klasik Bandara',
    description: 'Kartu lipat mekanis dengan garis belah tengah khas papan jadwal.',
    badge: 'Mekanis',
    recommendedThemes: ['3d']
  },
  {
    id: 'glossy-pill',
    name: 'Glosy Mengkilap',
    description: 'Efek kilap cermin atas-bawah dengan tombol detik bercahaya.',
    badge: 'Glosy',
    recommendedThemes: ['glossy']
  },
  {
    id: 'glass-frost',
    name: 'Kaca Kristal Frosted',
    description: 'Panel kaca transparan blur dengan tepian cahaya lembut.',
    badge: 'Glass',
    recommendedThemes: ['glass', 'windows11']
  }
];

export const getRecommendedClockStyleForTheme = (themeId?: string): ClockStyle => {
  const normalized = !themeId || themeId === 'green' ? 'default' : themeId;
  switch (normalized) {
    case 'blue':
      return 'analog-hybrid';
    case 'rose':
      return 'luxury-gold';
    case 'amber':
      return 'nixie-tube';
    case 'purple':
      return 'cyber-neon';
    case 'cyan':
      return 'minimal-swiss';
    case 'colorful':
      return 'prism-pop';
    case '3d':
      return 'flip-retro';
    case 'glossy':
      return 'glossy-pill';
    case 'glass':
    case 'windows11':
      return 'glass-frost';
    case 'ubuntu':
    case 'default':
    default:
      return '3d-blocks';
  }
};
