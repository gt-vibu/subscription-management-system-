import client from '../api/client';
import type { Plan } from '../types';

export const planService = {
  async getPlans(): Promise<Plan[]> {
    const response = await client.get('/plans');
    return response.data.data;
  },

  async getPlanById(id: string): Promise<Plan> {
    const response = await client.get(`/plans/${id}`);
    return response.data.data;
  },

  async createPlan(planData: Omit<Plan, '_id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Plan> {
    const response = await client.post('/plans', planData);
    return response.data.data;
  },

  async updatePlan(id: string, planData: Partial<Plan>): Promise<Plan> {
    const response = await client.put(`/plans/${id}`, planData);
    return response.data.data;
  },

  async archivePlan(id: string): Promise<Plan> {
    const response = await client.post(`/plans/${id}/archive`);
    return response.data.data;
  },

  async restorePlan(id: string): Promise<Plan> {
    const response = await client.post(`/plans/${id}/restore`);
    return response.data.data;
  }
};
export default planService;
