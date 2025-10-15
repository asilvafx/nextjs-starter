import { useState, useEffect } from 'react';

// Hook for fetching blocks in frontend components
export const useBlocks = (options = {}) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { type, active = true, autoFetch = true } = options;

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (active !== undefined) params.append('active', active.toString());
      
      const response = await fetch(`/api/query/public/blocks?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBlocks(data.data);
      } else {
        setError(data.error || 'Failed to fetch blocks');
      }
    } catch (err) {
      setError('Network error while fetching blocks');
      console.error('Error fetching blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchBlocks();
    }
  }, [type, active, autoFetch]);

  return {
    blocks,
    loading,
    error,
    refetch: fetchBlocks
  };
};

// Hook for fetching a single block by slug
export const useBlock = (slug, options = {}) => {
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { active = true, autoFetch = true } = options;

  const fetchBlock = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('slug', slug);
      if (active !== undefined) params.append('active', active.toString());
      
      const response = await fetch(`/api/query/public/blocks?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBlock(data.data);
      } else {
        setError(data.error || 'Block not found');
        setBlock(null);
      }
    } catch (err) {
      setError('Network error while fetching block');
      setBlock(null);
      console.error('Error fetching block:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchBlock();
    }
  }, [slug, active, autoFetch]);

  return {
    block,
    loading,
    error,
    refetch: fetchBlock
  };
};