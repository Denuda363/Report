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
  className = '',
}) => {
  if (!history || history.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-[10px] text-theme-500 font-medium flex items-center gap-1 mr-0.5 shrink-0">
        <History className="w-2.5 h-2.5" /> Terakhir:
      </span>
      {history.slice(0, 5).map((term, idx) => (
        <button
          key={`${term}-${idx}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(term);
          }}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white hover:bg-theme-100 text-theme-700 border border-theme-200 hover:border-theme-300 transition-colors shadow-2xs cursor-pointer truncate max-w-[120px]"
          title={`Cari "${term}"`}
        >
          <span className="truncate">{term}</span>
        </button>
      ))}
    </div>
  );
};
