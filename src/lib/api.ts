import { Catalog } from '../types';

const API_BASE_URL = 'https://edbe7e18-233b-4ff5-bed9-83c4e0edd51e-00-25a1ryv2rxe0o.sisko.replit.dev';

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
