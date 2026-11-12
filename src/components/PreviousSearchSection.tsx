import React, { useRef, useEffect } from 'react';
import { Clock, History, X, ArrowUpRight } from 'lucide-react';
import { SearchHistoryChips } from './SearchHistoryChips';

export interface PreviousSearchSectionProps<T = any> {
  lastQuery: string;
  results: T[];
  history?: string[];
  onSelectResult: (item: T) => void;
  onSelectQuery?: (query: string) => void;
  onClearHistory?: () => void;
  renderTitle: (item: T) => string;
  renderSubtitle?: (item: T) => string;
  renderBadge?: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  emptyMessage?: string;
  highlightedIndex?: number;
  onHighlightIndex?: (index: number) => void;
}

export function PreviousSearchSection<T = any>({
  lastQuery,
  results,
  history,
  onSelectResult,
  onSelectQuery,
  onClearHistory,
  renderTitle,
  renderSubtitle,
  renderBadge,
  keyExtractor,
  className = '',
  emptyMessage,
  highlightedIndex = -1,
  onHighlightIndex,
}: PreviousSearchSectionProps<T>) {
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedIndex >= 0 && listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, results]);

  if (!lastQuery && (!results || results.length === 0) && (!history || history.length === 0)) {
    return null;
  }

  return (
    <div className={`border-b border-theme-200/80 bg-theme-50/50 pb-2 ${className}`}>
      {/* Header section */}
      <div className="px-3 py-2 flex items-center justify-between text-xs border-b border-theme-100/80 bg-theme-100/40">
        <div className="flex items-center gap-1.5 font-bold text-theme-800 truncate">
          <History className="w-3.5 h-3.5 text-theme-500 shrink-0" />
          <span className="truncate">
            Hasil Pencarian Sebelumnya {lastQuery ? `("${lastQuery}")` : ''}
          </span>
        </div>
        {onClearHistory && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearHistory();
            }}
            className="text-[10px] text-theme-500 hover:text-rose-600 font-medium px-1.5 py-0.5 rounded hover:bg-theme-100 transition-colors shrink-0"
            title="Hapus riwayat pencarian"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Keywords Chips if available */}
      {history && history.length > 1 && onSelectQuery && (
        <div className="px-2 pt-1.5 pb-1">
          <SearchHistoryChips
            history={history}
            onSelect={onSelectQuery}
            onClear={onClearHistory}
          />
        </div>
      )}

      {/* Results list */}
      <div ref={listContainerRef} className="divide-y divide-theme-100/60 max-h-48 overflow-y-auto">
        {results && results.length > 0 ? (
          results.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={keyExtractor(item)}
                data-highlighted={isHighlighted ? 'true' : undefined}
                onClick={() => onSelectResult(item)}
                onMouseEnter={() => onHighlightIndex?.(idx)}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between gap-2 group text-left ${
                  isHighlighted
                    ? 'bg-theme-100 text-theme-900 ring-1 ring-inset ring-theme-300'
                    : 'hover:bg-theme-100/70'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-xs flex items-center gap-1.5 truncate ${
                    isHighlighted ? 'text-theme-900 font-bold' : 'text-theme-900 group-hover:text-theme-700'
                  }`}>
                    <Clock className={`w-3 h-3 shrink-0 ${isHighlighted ? 'text-theme-600' : 'text-theme-400 opacity-70'}`} />
                    <span className="truncate">{renderTitle(item)}</span>
                  </div>
                  {renderSubtitle && (
                    <div className="text-[10px] text-theme-600-text mt-0.5 truncate pl-4.5">
                      {renderSubtitle(item)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {renderBadge && renderBadge(item)}
                  <ArrowUpRight className={`w-3 h-3 transition-colors ${isHighlighted ? 'text-theme-700' : 'text-theme-300 group-hover:text-theme-600'}`} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-3 py-2 text-xs text-theme-500 text-center italic">
            {emptyMessage || `Tidak ada data cocok untuk "${lastQuery}"`}
          </div>
        )}
      </div>
    </div>
  );
}
