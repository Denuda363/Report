import React, { useState, useEffect } from 'react';

export const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return { hours, minutes, seconds };
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options); // Using Indonesian locale as per user language
  };

  const { hours, minutes, seconds } = formatTime(time);

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-white pl-3 pr-1 py-1 rounded-2xl border border-theme-200 shadow-sm">
      {/* Date */}
      <div className="text-[10px] sm:text-xs font-bold text-theme-600-text uppercase tracking-wide">
        {formatDate(time)}
      </div>
      
      {/* Separator */}
      <div className="w-px h-4 sm:h-5 bg-theme-200"></div>

      {/* Clock */}
      <div className="flex items-center gap-0.5">
        <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-theme-100 text-theme-900 font-mono text-sm md:text-base font-bold rounded-xl">
          {hours}
        </div>
        <span className="text-theme-500 font-bold animate-pulse px-0.5 -mt-0.5">:</span>
        <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-theme-100 text-theme-900 font-mono text-sm md:text-base font-bold rounded-xl">
          {minutes}
        </div>
        <span className="text-theme-500 font-bold animate-pulse px-0.5 -mt-0.5">:</span>
        <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-theme-500 text-white font-mono text-sm md:text-base font-bold rounded-xl shadow-[0_2px_8px_-2px_rgba(139,157,119,0.5)]">
          {seconds}
        </div>
      </div>
    </div>
  );
};
