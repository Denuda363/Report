import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { getLastSearchQuery, setLastSearchQuery, getSearchHistory, clearSearchHistory, addSearchHistory } from '../lib/searchHistory';

export interface UseSearchDropdownOptions<T> {
  storageKey: string;
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  onSelect?: (item: T) => void;
  limit?: number;
  initialQuery?: string;
}

export function useSearchDropdown<T>({
  storageKey,
  items,
  filterFn,
  onSelect,
  limit = 15,
  initialQuery = '',
}: UseSearchDropdownOptions<T>) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [lastSearchQuery, setLastSearchQueryState] = useState<string>(() => getLastSearchQuery(storageKey));
  const [searchHistory, setSearchHistoryState] = useState<string[]>(() => getSearchHistory(storageKey));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTypingNew, setIsTypingNew] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update lastSearchQuery from storage if key changes
  useEffect(() => {
    setLastSearchQueryState(getLastSearchQuery(storageKey));
    setSearchHistoryState(getSearchHistory(storageKey));
  }, [storageKey]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered results for the new typed query
  const newResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => filterFn(item, q)).slice(0, limit);
  }, [items, searchQuery, filterFn, limit]);

  // Filtered results for previous search query
  const previousResults = useMemo(() => {
    const q = (lastSearchQuery || '').trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => filterFn(item, q)).slice(0, limit);
  }, [items, lastSearchQuery, filterFn, limit]);

  // Determine current display mode
  // If user is actively typing a new query -> 'new'
  // If dropdown is open and user just clicked/focused without typing new query -> 'previous'
  const displayMode: 'previous' | 'new' | 'idle' = useMemo(() => {
    if (isTypingNew && searchQuery.trim()) {
      return 'new';
    }
    if (lastSearchQuery && lastSearchQuery.trim()) {
      return 'previous';
    }
    if (searchQuery.trim()) {
      return 'new';
    }
    return 'idle';
  }, [isTypingNew, searchQuery, lastSearchQuery]);

  const displayResults = useMemo(() => {
    if (displayMode === 'new') {
      return newResults;
    }
    if (displayMode === 'previous') {
      return previousResults;
    }
    return [];
  }, [displayMode, newResults, previousResults]);

  // Handle clicking or focusing search bar
  const handleInputClick = useCallback(() => {
    setIsDropdownOpen(true);
    setIsTypingNew(false);
    // Select input text so user can easily replace it with a new keyword
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, []);

  // Handle typing new characters
  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsTypingNew(true);
    setIsDropdownOpen(true);
  }, []);

  // Handle selecting an item
  const handleSelectItem = useCallback((item: T, itemLabel?: string) => {
    const typed = searchQuery.trim();
    // Save the keyword that was used to search
    let queryToSave = '';
    if (isTypingNew && typed) {
      queryToSave = typed;
    } else if (lastSearchQuery) {
      queryToSave = lastSearchQuery;
    } else if (itemLabel) {
      queryToSave = itemLabel;
    }

    if (queryToSave) {
      setLastSearchQuery(storageKey, queryToSave);
      setLastSearchQueryState(queryToSave);
      const updated = addSearchHistory(storageKey, queryToSave);
      setSearchHistoryState(updated);
    }

    // Close dropdown immediately upon selection
    setIsDropdownOpen(false);
    setIsTypingNew(false);

    if (onSelect) {
      onSelect(item);
    }
  }, [isTypingNew, searchQuery, lastSearchQuery, storageKey, onSelect]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setIsTypingNew(false);
    setIsDropdownOpen(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    clearSearchHistory(storageKey);
    setLastSearchQueryState('');
    setSearchHistoryState([]);
  }, [storageKey]);

  return {
    searchQuery,
    setSearchQuery,
    lastSearchQuery,
    searchHistory,
    isDropdownOpen,
    setIsDropdownOpen,
    isTypingNew,
    setIsTypingNew,
    displayMode,
    displayResults,
    newResults,
    previousResults,
    inputRef,
    dropdownRef,
    handleInputClick,
    handleInputChange,
    handleSelectItem,
    handleClear,
    handleClearHistory,
  };
}
