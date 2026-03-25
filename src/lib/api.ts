import { Catalog } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = {
  async getCatalog(): Promise<Catalog> {
    const response = await fetch(`${API_BASE_URL}/api/catalog`);
    if (!response.ok) {
      throw new Error('Failed to fetch catalog');
    }
    return response.json();
  },

  async refreshCatalog(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/refresh`);
    if (!response.ok) {
      throw new Error('Failed to refresh catalog');
    }
    return response.json();
  },

  getVideoStreamUrl(videoId: string): string {
    return `${API_BASE_URL}/api/stream/${videoId}`;
  },
};
