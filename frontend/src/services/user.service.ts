import client from '../api/client';
import type { User } from '../types';

export interface UsersListResponse {
  success: boolean;
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  data: User[];
}

export const userService = {
  async getUsers(search: string = '', page: number = 1, limit: number = 10): Promise<UsersListResponse> {
    const response = await client.get('/users', {
      params: { search, page, limit }
    });
    return response.data;
  },

  async changeRole(userId: string, role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'): Promise<User> {
    const response = await client.patch(`/users/${userId}/role`, { role });
    return response.data.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await client.delete(`/users/${userId}`);
  },

  async createUser(userData: any): Promise<User> {
    const response = await client.post('/users', userData);
    return response.data.data;
  },

  async updateUserSubscription(
    userId: string,
    planId: string | null,
    months?: number,
    action?: 'subscribe' | 'cancel' | 'change',
    subscriptionId?: string
  ): Promise<any> {
    const response = await client.patch(`/users/${userId}/subscription`, {
      planId,
      months,
      action,
      subscriptionId
    });
    return response.data.data;
  }
};
export default userService;
