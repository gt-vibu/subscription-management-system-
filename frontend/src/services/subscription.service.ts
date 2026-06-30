import client from '../api/client';
import type { Subscription } from '../types';

export interface UserSubscriptionDetails {
  active: Subscription | null;
  history: Subscription[];
}

export const subscriptionService = {
  async getMySubscription(): Promise<UserSubscriptionDetails> {
    const response = await client.get('/subscriptions/my');
    return response.data.data;
  },

  async subscribe(planId: string, months?: number): Promise<Subscription> {
    const response = await client.post('/subscriptions/subscribe', { planId, months });
    return response.data.data;
  },

  async changePlan(planId: string, months?: number): Promise<Subscription> {
    const response = await client.post('/subscriptions/change', { planId, months });
    return response.data.data;
  },

  async cancelSubscription(): Promise<Subscription> {
    const response = await client.post('/subscriptions/cancel');
    return response.data.data;
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const response = await client.get('/subscriptions/all');
    return response.data.data;
  }
};
export default subscriptionService;
