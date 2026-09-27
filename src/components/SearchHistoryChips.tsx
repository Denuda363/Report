import React from 'react';
import { History, X } from 'lucide-react';

interface SearchHistoryChipsProps {
  history: string[];
  onSelect: (term: string) => void;
  onClear?: () => void;
  className?: string;
}

export const SearchHistoryChips: React.FC<SearchHistoryChipsProps> = ({
  history,
  onSelect,
  onClear,
  className = ''
}) => {
  if (!history || history.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap px-3 py-2 bg-neutral-50/80 border-b border-neutral-100 text-xs ${className}`}>
      <span className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1 shrink-0">
        <History className="w-3 h-3 text-neutral-400" /> Riwayat:
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {history.map((term, idx) => (
          <button
            key={`${term}-${idx}`}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(term);
            }}
            className="px-2 py-0.5 bg-white border border-neutral-200 hover:border-theme-400 hover:bg-theme-50 hover:text-theme-700 text-neutral-600 rounded-full text-[11px] font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {term}
          </button>
        ))}
      </div>
      {onClear && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onClear();
          }}
          className="ml-auto text-[10px] text-neutral-400 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer"
          title="Hapus riwayat pencarian"
        >
          <X className="w-2.5 h-2.5" /> Hapus
        </button>
      )}
    </div>
  );
};
