import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { ClockStyle } from '../types';
import { getRecommendedClockStyleForTheme } from '../lib/clockStyles';

export interface ClockProps {
  previewStyle?: ClockStyle;
  compactPreview?: boolean;
}

export const Clock: React.FC<ClockProps> = ({ previewStyle, compactPreview = false }) => {
  const { settings } = useAppContext();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStyle: ClockStyle =
    previewStyle || settings.clockStyle || getRecommendedClockStyleForTheme(settings.theme);

  const hoursNum = time.getHours();
  const minutesNum = time.getMinutes();
  const secondsNum = time.getSeconds();

  const hours = hoursNum.toString().padStart(2, '0');
  const minutes = minutesNum.toString().padStart(2, '0');
  const seconds = secondsNum.toString().padStart(2, '0');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const secShowClass = compactPreview ? 'flex' : 'hidden xs:flex';
  const colonSecShowClass = compactPreview ? 'inline' : 'hidden xs:inline';

  // 1. Analog + Digital Hybrid
  if (activeStyle === 'analog-hybrid') {
    const secDeg = secondsNum * 6;
    const minDeg = minutesNum * 6 + secondsNum * 0.1;
    const hourDeg = (hoursNum % 12) * 30 + minutesNum * 0.5;

    return (
      <div className="flex items-center gap-2 sm:gap-2.5 bg-white px-2.5 py-1.5 rounded-2xl border border-theme-200 shadow-sm shrink-0">
        {/* Live SVG Analog Dial */}
        <svg
          viewBox="0 0 40 40"
          className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 drop-shadow-xs"
          aria-hidden="true"
        >
          <circle cx="20" cy="20" r="18.5" className="fill-theme-50 stroke-theme-300" strokeWidth="1.5" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <line
              key={angle}
              x1="20"
              y1="3.5"
              x2="20"
              y2={angle % 90 === 0 ? '6.5' : '5'}
              transform={`rotate(${angle} 20 20)`}
              className={angle % 90 === 0 ? 'stroke-theme-700' : 'stroke-theme-300'}
              strokeWidth={angle % 90 === 0 ? '1.5' : '1'}
              strokeLinecap="round"
            />
          ))}
          {/* Hour hand */}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="10.5"
            transform={`rotate(${hourDeg} 20 20)`}
            className="stroke-theme-900"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Minute hand */}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="7.2"
            transform={`rotate(${minDeg} 20 20)`}
            className="stroke-theme-600"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Second hand */}
          <line
            x1="20"
            y1="23"
            x2="20"
            y2="6"
            transform={`rotate(${secDeg} 20 20)`}
            stroke="#e11d48"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <circle cx="20" cy="20" r="2" className="fill-theme-900" />
        </svg>

        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-0.5 font-mono tabular-nums">
            <span className="text-sm sm:text-base font-black text-theme-900">{hours}</span>
            <span className="text-theme-500 font-bold text-xs">:</span>
            <span className="text-sm sm:text-base font-black text-theme-900">{minutes}</span>
            <span className={`${colonSecShowClass} text-[11px] font-bold text-theme-600 ml-0.5`}>
              :{seconds}
            </span>
          </div>
          {!compactPreview && (
            <span className="hidden sm:block text-[10px] font-bold text-theme-600-text tracking-wide mt-0.5">
              {formatShortDate(time)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 2. Eksekutif Emas (Luxury Gold & Obsidian)
  if (activeStyle === 'luxury-gold') {
    return (
      <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-b from-neutral-900 to-neutral-950 px-3 py-1.5 rounded-2xl border border-amber-400/40 shadow-[0_4px_12px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(251,191,36,0.25)] shrink-0">
        {!compactPreview && (
          <>
            <div className="hidden sm:block text-[10px] sm:text-[11px] font-semibold text-amber-200/80 uppercase tracking-wider">
              {formatShortDate(time)}
            </div>
            <div className="hidden sm:block w-px h-4 bg-amber-400/25" />
          </>
        )}
        <div className="flex items-center gap-1 font-mono tabular-nums">
          <span className="text-sm sm:text-base font-black text-amber-300 tracking-wider drop-shadow-[0_1px_4px_rgba(251,191,36,0.35)]">
            {hours}
          </span>
          <span className="text-amber-500/80 font-bold text-xs animate-pulse">:</span>
          <span className="text-sm sm:text-base font-black text-amber-300 tracking-wider drop-shadow-[0_1px_4px_rgba(251,191,36,0.35)]">
            {minutes}
          </span>
          <span className={`${colonSecShowClass} text-amber-500/80 font-bold text-xs`}>:</span>
          <span className={`${secShowClass} items-center justify-center px-1.5 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/35 text-[11px] sm:text-xs font-black text-amber-200`}>
            {seconds}
          </span>
        </div>
      </div>
    );
  }

  // 3. Tabung Nixie Hangat (Warm Amber Tube)
  if (activeStyle === 'nixie-tube') {
    return (
      <div className="flex items-center gap-2 bg-[#1a120d] px-2.5 py-1.5 rounded-2xl border border-amber-700/50 shadow-[0_4px_12px_rgba(120,53,15,0.35),inset_0_2px_6px_rgba(0,0,0,0.8)] shrink-0">
        {!compactPreview && (
          <div className="hidden sm:block text-[10px] font-bold text-amber-300/75 tracking-wide pr-1">
            {formatShortDate(time)}
          </div>
        )}
        <div className="flex items-center gap-1 font-mono tabular-nums">
          {[hours, minutes].map((part, idx) => (
            <React.Fragment key={idx}>
              <div className="px-2 py-1 rounded-xl bg-gradient-to-b from-[#2b1a10] to-[#140b06] border border-orange-500/35 shadow-[inset_0_0_8px_rgba(249,115,22,0.3)] text-orange-400 font-black text-xs sm:text-sm tracking-widest drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]">
                {part}
              </div>
              {idx === 0 && (
                <span className="text-orange-500 font-black text-xs animate-pulse">:</span>
              )}
            </React.Fragment>
          ))}
          <span className={`${colonSecShowClass} text-orange-500 font-black text-xs animate-pulse`}>:</span>
          <div className={`${secShowClass} items-center justify-center px-2 py-1 rounded-xl bg-gradient-to-b from-[#3a2011] to-[#1a0d06] border border-amber-400/50 shadow-[inset_0_0_10px_rgba(245,158,11,0.35)] text-amber-300 font-black text-xs sm:text-sm tracking-widest drop-shadow-[0_0_6px_rgba(251,191,36,0.85)]`}>
            {seconds}
          </div>
        </div>
      </div>
    );
  }

  // 4. Cyber OLED Neon
  if (activeStyle === 'cyber-neon') {
    return (
      <div className="flex items-center gap-2 sm:gap-2.5 bg-[#090d16] px-2.5 sm:px-3 py-1.5 rounded-2xl border border-cyan-400/40 shadow-[0_0_16px_rgba(6,182,212,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] shrink-0">
        {!compactPreview && (
          <>
            <div className="hidden sm:block text-[10px] font-bold text-cyan-200/80 uppercase tracking-wider">
              {formatShortDate(time)}
            </div>
            <div className="hidden sm:block w-px h-4 bg-cyan-500/30" />
          </>
        )}
        <div className="flex items-center gap-1 font-mono tabular-nums">
          <span className="text-sm sm:text-base font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            {hours}
          </span>
          <span className="text-fuchsia-400 font-black text-xs animate-pulse">:</span>
          <span className="text-sm sm:text-base font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            {minutes}
          </span>
          <span className={`${colonSecShowClass} text-fuchsia-400 font-black text-xs`}>:</span>
          <span className={`${secShowClass} items-center justify-center px-1.5 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500/25 to-fuchsia-500/25 border border-fuchsia-400/45 text-fuchsia-300 text-xs font-black drop-shadow-[0_0_6px_rgba(232,121,249,0.7)]`}>
            {seconds}
          </span>
        </div>
      </div>
    );
  }

  // 5. Minimalis Swiss
  if (activeStyle === 'minimal-swiss') {
    return (
      <div className="flex items-center gap-2 sm:gap-3 bg-white/90 px-3 py-1.5 rounded-xl border border-neutral-200 shadow-2xs shrink-0">
        {!compactPreview && (
          <>
            <span className="hidden sm:inline text-[11px] font-semibold text-neutral-500">
              {formatShortDate(time)}
            </span>
            <span className="hidden sm:inline text-neutral-300">·</span>
          </>
        )}
        <div className="flex items-baseline gap-0.5 font-mono tabular-nums">
          <span className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
            {hours}:{minutes}
          </span>
          <span className={`${colonSecShowClass} text-[11px] font-bold text-theme-600 ml-0.5`}>
            :{seconds}
          </span>
        </div>
      </div>
    );
  }

  // 6. Prisma Warna 3D (Colorful 3D Pop Tiles)
  if (activeStyle === 'prism-pop') {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-2.5 py-1 rounded-2xl border border-pink-200 shadow-sm shrink-0">
        {!compactPreview && (
          <div className="hidden sm:block text-[10px] font-bold text-indigo-700 pr-1">
            {formatShortDate(time)}
          </div>
        )}
        <div className="flex items-center gap-1 font-mono tabular-nums">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-b from-rose-400 to-pink-600 text-white text-xs sm:text-sm font-black shadow-[0_3px_0_#be185d]">
            {hours}
          </div>
          <span className="text-pink-500 font-black text-xs">:</span>
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-b from-violet-400 to-purple-600 text-white text-xs sm:text-sm font-black shadow-[0_3px_0_#6d28d9]">
            {minutes}
          </div>
          <span className={`${colonSecShowClass} text-purple-500 font-black text-xs`}>:</span>
          <div className={`${secShowClass} items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-b from-cyan-400 to-sky-600 text-white text-xs sm:text-sm font-black shadow-[0_3px_0_#0369a1]`}>
            {seconds}
          </div>
        </div>
      </div>
    );
  }

  // 7. Flip Klasik Bandara (Mechanical Split-Flap)
  if (activeStyle === 'flip-retro') {
    const renderFlap = (val: string, accent = false) => (
      <div
        className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono tabular-nums text-xs sm:text-sm font-black overflow-hidden border shadow-[0_3px_0_#09090b] ${
          accent
            ? 'bg-gradient-to-b from-theme-600 to-theme-700 text-white border-theme-700'
            : 'bg-gradient-to-b from-neutral-800 to-neutral-900 text-neutral-100 border-neutral-950'
        }`}
      >
        <span className="relative z-10">{val}</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/45 z-20" />
      </div>
    );

    return (
      <div className="flex items-center gap-1.5 sm:gap-2.5 bg-neutral-100 px-2 sm:px-2.5 py-1 rounded-2xl border border-neutral-300 shadow-sm shrink-0">
        {!compactPreview && (
          <div className="hidden sm:block text-[10px] font-bold text-neutral-600 uppercase tracking-wide">
            {formatShortDate(time)}
          </div>
        )}
        <div className="flex items-center gap-1">
          {renderFlap(hours)}
          <span className="text-neutral-500 font-black text-xs">:</span>
          {renderFlap(minutes)}
          <span className={`${colonSecShowClass} text-neutral-500 font-black text-xs`}>:</span>
          <div className={secShowClass}>{renderFlap(seconds, true)}</div>
        </div>
      </div>
    );
  }

  // 8. Glosy Mengkilap (Glossy Shine Capsule)
  if (activeStyle === 'glossy-pill') {
    return (
      <div className="relative flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1 rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#e2f1fc_52%,#cfe7fa_100%)] border border-sky-300 shadow-[0_4px_0_#7dd3fc,0_8px_16px_rgba(14,165,233,0.22),inset_0_2px_2px_rgba(255,255,255,0.95)] shrink-0 overflow-hidden">
        {!compactPreview && (
          <>
            <div className="hidden sm:block text-[10px] sm:text-xs font-extrabold text-sky-900 tracking-wide">
              {formatShortDate(time)}
            </div>
            <div className="hidden sm:block w-px h-4 bg-sky-300" />
          </>
        )}
        <div className="flex items-center gap-1 font-mono tabular-nums">
          <span className="px-2 py-0.5 rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#dbeafe_55%,#bfdbfe_100%)] border border-white text-sky-950 font-black text-xs sm:text-sm shadow-xs">
            {hours}
          </span>
          <span className="text-sky-600 font-black text-xs">:</span>
          <span className="px-2 py-0.5 rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#dbeafe_55%,#bfdbfe_100%)] border border-white text-sky-950 font-black text-xs sm:text-sm shadow-xs">
            {minutes}
          </span>
          <span className={`${colonSecShowClass} text-sky-600 font-black text-xs`}>:</span>
          <span className={`${secShowClass} items-center justify-center px-2 py-0.5 rounded-xl bg-[linear-gradient(180deg,#38bdf8_0%,#0284c7_52%,#0369a1_100%)] border border-sky-200/80 text-white font-black text-xs sm:text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]`}>
            {seconds}
          </span>
        </div>
      </div>
    );
  }

  // 9. Kaca Kristal Frosted (Glassmorphism)
  if (activeStyle === 'glass-frost') {
    return (
      <div className="flex items-center gap-2 sm:gap-2.5 bg-white/45 backdrop-blur-xl px-2.5 sm:px-3 py-1 rounded-2xl border border-white/80 shadow-[0_8px_20px_rgba(79,70,229,0.14),inset_0_1px_1px_rgba(255,255,255,0.9)] shrink-0">
        {!compactPreview && (
          <>
            <div className="hidden sm:block text-[10px] sm:text-xs font-bold text-indigo-950/80 tracking-wide">
              {formatShortDate(time)}
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/70" />
          </>
        )}
        <div className="flex items-center gap-1 font-mono tabular-nums">
          <div className="px-2 py-0.5 rounded-xl bg-white/60 border border-white/80 text-indigo-950 font-black text-xs sm:text-sm shadow-2xs">
            {hours}
          </div>
          <span className="text-indigo-600 font-bold text-xs animate-pulse">:</span>
          <div className="px-2 py-0.5 rounded-xl bg-white/60 border border-white/80 text-indigo-950 font-black text-xs sm:text-sm shadow-2xs">
            {minutes}
          </div>
          <span className={`${colonSecShowClass} text-indigo-600 font-bold text-xs animate-pulse`}>:</span>
          <div className={`${secShowClass} items-center justify-center px-2 py-0.5 rounded-xl bg-indigo-600/80 border border-white/60 text-white font-black text-xs sm:text-sm shadow-xs`}>
            {seconds}
          </div>
        </div>
      </div>
    );
  }

  // 10. Default: 3D Blok Taktil ('3d-blocks')
  return (
    <div className="flex items-center gap-1.5 sm:gap-3 bg-white px-2 sm:pl-3 sm:pr-1.5 py-1 rounded-2xl border border-theme-200 shadow-sm shrink-0">
      {!compactPreview && (
        <>
          <div className="hidden sm:block text-[10px] sm:text-xs font-bold text-theme-600-text uppercase tracking-wide">
            {formatDate(time)}
          </div>
          <div className="hidden sm:block w-px h-4 sm:h-5 bg-theme-200" />
        </>
      )}

      <div className="flex items-center gap-0.5 font-mono tabular-nums">
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-theme-100 text-theme-900 border border-theme-200 text-xs sm:text-sm font-black rounded-lg sm:rounded-xl shadow-[0_2px_0_var(--color-theme-300)]">
          {hours}
        </div>
        <span className="text-theme-500 font-bold animate-pulse px-0.5 -mt-0.5 text-xs sm:text-sm">:</span>
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-theme-100 text-theme-900 border border-theme-200 text-xs sm:text-sm font-black rounded-lg sm:rounded-xl shadow-[0_2px_0_var(--color-theme-300)]">
          {minutes}
        </div>
        <span className={`${colonSecShowClass} text-theme-500 font-bold animate-pulse px-0.5 -mt-0.5 text-xs sm:text-sm`}>:</span>
        <div className={`${secShowClass} items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-theme-500 text-white text-xs sm:text-sm font-black rounded-lg sm:rounded-xl shadow-[0_3px_0_var(--color-theme-700)]`}>
          {seconds}
        </div>
      </div>
    </div>
  );
};
