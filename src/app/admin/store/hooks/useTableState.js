"use client";

import { useState, useCallback } from "react";

export function useTableState(initialPageSize = 10) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleSort = useCallback((key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const getFilteredAndSortedItems = useCallback((itemsToFilter) => {
    let filtered = [...itemsToFilter];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    }

    filtered.sort((a, b) => {
      let aValue = sortConfig.key.split(".").reduce((obj, key) => obj?.[key], a);
      let bValue = sortConfig.key.split(".").reduce((obj, key) => obj?.[key], b);

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [search, sortConfig]);

  const getPaginatedItems = useCallback((filteredItems) => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [currentPage, pageSize]);

  const totalPages = useCallback((filteredItems) => {
    return Math.ceil(filteredItems.length / pageSize);
  }, [pageSize]);

  return {
    items,
    setItems,
    loading,
    setLoading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    sortConfig,
    handleSort,
    getFilteredAndSortedItems,
    getPaginatedItems,
    totalPages,
  };
}