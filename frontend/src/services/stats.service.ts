import client from '../api/client';
import type { PlatformStats, PricingLog, PublicStats } from '../types';

export const statsService = {
  async getStats(): Promise<PlatformStats> {
    const response = await client.get('/stats');
    return response.data.data;
  },

  async getPricingLogs(): Promise<PricingLog[]> {
    const response = await client.get('/stats/pricing-logs');
    return response.data.data;
  },

  async getPublicStats(): Promise<PublicStats> {
    const response = await client.get('/stats/public');
    return response.data.data;
  }
};
export default statsService;
