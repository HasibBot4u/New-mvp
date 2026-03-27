import { Catalog } from '../types';

const PRIMARY_BACKEND = 'https://nexusedu-backend-0bjq.onrender.com';
const SECONDARY_BACKEND = 'https://edbe7e18-233b-4ff5-bed9-83c4e0edd51e-00-25a1ryv2rxe0o.sisko.replit.dev';

// Helper to get the currently working backend
async function getWorkingBackend(): Promise<string> {
  // Check if we have a cached working backend
  const cachedBackend = localStorage.getItem('working_backend');
  if (cachedBackend) {
    try {
      const response = await fetch(`${cachedBackend}/api/catalog`, { method: 'HEAD' });
      if (response.ok) return cachedBackend;
    } catch (e) {
      // Cached backend failed, fall through to check both
    }
  }

  // Try primary
  try {
    const response = await fetch(`${PRIMARY_BACKEND}/api/catalog`, { method: 'HEAD' });
    if (response.ok) {
      localStorage.setItem('working_backend', PRIMARY_BACKEND);
      return PRIMARY_BACKEND;
    }
  } catch (e) {
    console.warn('Primary backend failed, trying secondary...');
  }

  // Try secondary
  try {
    const response = await fetch(`${SECONDARY_BACKEND}/api/catalog`, { method: 'HEAD' });
    if (response.ok) {
      localStorage.setItem('working_backend', SECONDARY_BACKEND);
      return SECONDARY_BACKEND;
    }
  } catch (e) {
    console.error('Both backends failed');
  }

  // Default to primary if both fail HEAD checks (maybe CORS issue on HEAD, let GET try)
  return PRIMARY_BACKEND;
}

export const api = {
  async getCatalog(): Promise<Catalog> {
    const baseUrl = await getWorkingBackend();
    const response = await fetch(`${baseUrl}/api/catalog`);
    if (!response.ok) {
      throw new Error('Failed to fetch catalog');
    }
    const data = await response.json();
    // Cache the catalog data
    localStorage.setItem('catalog_cache', JSON.stringify(data));
    return data;
  },

  async getCatalogWithCache(): Promise<Catalog> {
    try {
      return await this.getCatalog();
    } catch (error) {
      const cached = localStorage.getItem('catalog_cache');
      if (cached) {
        console.warn('Using cached catalog due to fetch error');
        return JSON.parse(cached);
      }
      throw error;
    }
  },

  async refreshCatalog(): Promise<{ status: string; message: string }> {
    const baseUrl = await getWorkingBackend();
    const response = await fetch(`${baseUrl}/api/refresh`);
    if (!response.ok) {
      throw new Error('Failed to refresh catalog');
    }
    return response.json();
  },

  getVideoStreamUrl(videoId: string): string {
    const baseUrl = localStorage.getItem('working_backend') || PRIMARY_BACKEND;
    return `${baseUrl}/api/stream/${videoId}`;
  },
};
