export const getSearchHistory = (key: string): string[] => {
  try {
    const data = localStorage.getItem(`search_history_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addSearchHistory = (key: string, query: string): string[] => {
  if (!query || !query.trim()) return getSearchHistory(key);
  const trimmed = query.trim();
  try {
    const history = getSearchHistory(key);
    const updated = [trimmed, ...history.filter(h => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    localStorage.setItem(`search_history_${key}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const clearSearchHistory = (key: string): void => {
  try {
    localStorage.removeItem(`search_history_${key}`);
  } catch (e) {}
};

export const getLastSearchQuery = (key: string): string => {
  try {
    const direct = localStorage.getItem(`last_search_${key}`);
    if (direct && direct.trim()) return direct.trim();
  } catch (e) {}
  const history = getSearchHistory(key);
  return history.length > 0 ? history[0] : '';
};

export const setLastSearchQuery = (key: string, query: string): void => {
  if (!query || !query.trim()) return;
  const trimmed = query.trim();
  try {
    localStorage.setItem(`last_search_${key}`, trimmed);
  } catch (e) {}
  addSearchHistory(key, trimmed);
};

export const getPreviousSearchResults = <T>(
  key: string,
  items: T[],
  matchFn: (item: T, query: string) => boolean,
  limit: number = 8
): { lastQuery: string; results: T[] } | null => {
  const history = getSearchHistory(key);
  if (!history || history.length === 0) return null;
  const lastQuery = history[0];
  if (!lastQuery || !lastQuery.trim()) return null;

  const results = items
    .filter((item) => matchFn(item, lastQuery.trim().toLowerCase()))
    .slice(0, limit);

  return { lastQuery, results };
};
