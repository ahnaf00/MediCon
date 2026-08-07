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
   * Calls Laravel backend to send OTP.
   */
  async sendOtp(phone: string): Promise<void> {
    await axiosClient.post('/auth/send-otp', { phone });
  },

  /**
   * Calls Laravel backend to verify OTP.
   */
  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{ isNewUser: boolean; token?: string; user?: User }> {
    try {
      // Laravel API: POST /auth/verify-otp
      const response = (await axiosClient.post('/auth/verify-otp', {
        phone,
        otp,
      })) as any;
      
      if (response.isNewUser) {
        return { isNewUser: true };
      }

      // Response returns access_token and user object
      return {
        isNewUser: false,
        token: response.access_token,
        user: response.user,
      };
    } catch (error: any) {
      // The backend returns 400 for invalid OTP, 429 for max attempts
      if (error?.status === 401 || error?.status === 422 || error?.status === 400 || error?.status === 429) {
         throw error;
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
    // Construct payload dynamically based on role
    const payload: any = {
      phone,
      role,
      name: profileData.fullName,
    };

    if (role === 'doctor') {
      payload.specialty = profileData.department;
      payload.qualification = profileData.licenseNumber;
    } else {
      payload.date_of_birth = profileData.dateOfBirth;
      payload.blood_group = profileData.bloodGroup;
      payload.height_cm = profileData.heightCm;
      payload.weight_kg = profileData.weightKg;
      payload.allergies = profileData.allergies;
      payload.chronic_conditions = profileData.chronicConditions;
    }

    // Laravel API: POST /auth/register
    const response = (await axiosClient.post('/auth/register', payload)) as any;

    return {
      token: response.access_token,
      user: response.user,
    };
  },
  
  /**
   * Gets current user profile
   */
  async me(): Promise<User> {
    return (await axiosClient.get('/user/me')) as any;
  }
};
