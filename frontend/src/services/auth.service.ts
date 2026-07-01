import client from '../api/client';
import type { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<User> {
    const response = await client.post('/auth/register', { name, email, password });
    const { user } = response.data.data;
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await client.post('/auth/login', { email, password });
    const { user } = response.data.data;
    return user;
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
  },

  async getProfile(): Promise<User> {
    const response = await client.get('/auth/me');
    return response.data.data.user;
  }
};
export default authService;
