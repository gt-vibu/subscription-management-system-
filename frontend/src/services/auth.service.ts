import client from '../api/client';
import type { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<User> {
    const response = await client.post('/auth/register', { name, email, password });
    return response.data.data.user;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await client.post('/auth/login', { email, password });
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
  },

  async getProfile(): Promise<User> {
    const response = await client.get('/auth/me');
    return response.data.data.user;
  },

  async verifyEmail(email: string, otp: string): Promise<User> {
    const response = await client.post('/auth/verify-email', { email, otp });
    return response.data.data.user;
  },

  async resendOtp(email: string): Promise<void> {
    await client.post('/auth/resend-otp', { email });
  }
};
export default authService;
