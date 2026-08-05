import { UserRole } from '../../store/authStore';
import { axiosClient } from './axiosClient';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  avatar_url?: string;
}

export const authService = {
  /**
   * Mocks sending OTP (since backend assumes standard credentials or handles it differently).
   */
  async sendOtp(phone: string): Promise<void> {
    return Promise.resolve();
  },

  /**
   * Calls Laravel backend login.
   */
  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{ isNewUser: boolean; token?: string; user?: User }> {
    try {
      // Laravel API: POST /auth/login
      const response = await axiosClient.post('/auth/login', {
        login: phone,
        password: otp,
      });
      
      // Response returns access_token and user object
      return {
        isNewUser: false,
        token: response.access_token,
        user: response.user,
      };
    } catch (error: any) {
      if (error?.message === 'Invalid credentials' || error?.status === 401 || error?.response?.status === 404 || error?.response?.status === 422) {
         return { isNewUser: true };
      }
      throw error;
    }
  },

  /**
   * Registers a new user.
   */
  async register(
    phone: string,
    role: UserRole,
    profileData: any,
  ): Promise<{ token: string; user: User }> {
    // Laravel API: POST /auth/register
    const response = await axiosClient.post('/auth/register', {
      phone,
      name: profileData.fullName || 'User',
      email: profileData.email || `${phone}@example.com`, // mock email if not provided
      password: '123456',
      password_confirmation: '123456',
      role,
      ...profileData,
    });

    return {
      token: response.access_token,
      user: response.user,
    };
  },
  
  /**
   * Gets current user profile
   */
  async me(): Promise<User> {
    return await axiosClient.get('/user/me');
  }
};
