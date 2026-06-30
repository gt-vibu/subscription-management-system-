import client from '../api/client';
import type { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<User> {
    const response = await client.post('/auth/register', { name, email, password });
    const { user, token } = response.data.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await client.post('/auth/login', { email, password });
    const { user, token } = response.data.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    return user;
  },

  async logout(): Promise<void> {
    try {
      await client.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getProfile(): Promise<User> {
    const response = await client.get('/auth/me');
    return response.data.data.user;
  }
};
export default authService;
