import React, { createContext, useContext, useEffect, useState } from 'react';
import { Catalog } from '../types';
import { api } from '../lib/api';

interface CatalogContextType {
  catalog: Catalog | null;
  isLoading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getCatalogWithCache();
      setCatalog(data);
      
      // After catalog fetch succeeds, trigger backend warmup
      api.warmup();
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const refreshCatalog = async () => {
    try {
      await api.refreshCatalog();
      await fetchCatalog();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh catalog');
      throw err;
    }
  };

  return (
    <CatalogContext.Provider value={{ catalog, isLoading, error, refreshCatalog }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
