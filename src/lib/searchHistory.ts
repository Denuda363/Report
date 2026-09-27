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
