/**
 * Custom hook for filtering and searching items
 */

import { useState, useMemo, useCallback } from "react";

export interface UseFilterOptions<T> {
  items: T[];
  searchKey: keyof T;
  initialSearch?: string;
}

/**
 * Hook to manage filtering and searching of items
 */
export const useFilter = <T,>({
  items,
  searchKey,
  initialSearch = "",
}: UseFilterOptions<T>) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter items based on search term
  const filtered = useMemo(() => {
    if (!searchTerm) return items;

    return items.filter((item) => {
      const value = item[searchKey];
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }, [items, searchTerm, searchKey]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setShowDropdown(false);
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setShowDropdown((prev) => !prev);
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    showDropdown,
    setShowDropdown,
    toggleDropdown,
    closeDropdown,
    clearSearch,
    filtered,
    hasResults: filtered.length > 0,
    resultCount: filtered.length,
  };
};
