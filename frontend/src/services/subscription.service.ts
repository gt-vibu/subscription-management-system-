import client from '../api/client';
import type { Subscription } from '../types';

export interface UserSubscriptionDetails {
  active: Subscription[];
  history: Subscription[];
}

export const subscriptionService = {
  async getMySubscription(): Promise<UserSubscriptionDetails> {
    const response = await client.get('/subscriptions/my');
    return response.data.data;
  },

  async subscribe(planId: string, billingCycle?: 'MONTHLY' | 'ANNUAL', months?: number): Promise<Subscription> {
    const response = await client.post('/subscriptions/subscribe', { planId, billingCycle, months });
    return response.data.data;
  },

  async changePlan(subscriptionId: string, planId: string, billingCycle?: 'MONTHLY' | 'ANNUAL', months?: number): Promise<Subscription> {
    const response = await client.post('/subscriptions/change', { subscriptionId, planId, billingCycle, months });
    return response.data.data;
  },

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    const response = await client.post('/subscriptions/cancel', { subscriptionId });
    return response.data.data;
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const response = await client.get('/subscriptions/all');
    return response.data.data;
  }
};
export default subscriptionService;
