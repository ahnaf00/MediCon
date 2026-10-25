import { UserRole } from '../../store/authStore';
import { axiosClient } from './axiosClient';

export interface PatientProfileData {
  id?: number;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  emergencyContact?: string;
  address?: string;
}

export interface DoctorProfileData {
  id?: number;
  specialty?: string;
  qualification?: string;
  /** Printed on prescriptions; fixed once the doctor is verified. */
  bmdcRegistrationNo?: string | null;
  hospitalName?: string | null;
  experienceYears?: number;
  consultationFee?: number;
  rating?: number;
  bio?: string;
  verificationStatus?: string;
  /** Only sent to the doctor themself, when an admin rejected the registration. */
  rejectionReason?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  avatar_url?: string;
  avatarUrl?: string;
  patientProfile?: PatientProfileData;
  doctorProfile?: DoctorProfileData;
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
  ): Promise<{ isNewUser: boolean; token?: string; user?: User; registrationToken?: string }> {
    // Laravel API: POST /auth/verify-otp
    const response = (await axiosClient.post('/auth/verify-otp', {
      phone,
      otp,
    })) as any;

    if (response.isNewUser) {
      // Single-use proof that this phone passed OTP; register() must send it back.
      return { isNewUser: true, registrationToken: response.registration_token };
    }

    // Response returns access_token and user object
    return {
      isNewUser: false,
      token: response.access_token,
      user: response.user,
    };
  },

  /**
   * Registers a new user.
   */
  async register(
    phone: string,
    role: UserRole,
    profileData: any,
    registrationToken: string,
  ): Promise<{ token: string; user: User }> {
    const payload: any = {
      phone,
      role,
      registration_token: registrationToken,
      name: profileData.fullName,
    };

    if (role === 'doctor') {
      payload.specialty = profileData.department;
      payload.qualification = profileData.qualification;
      // The licence goes to its own field, printed on prescriptions (audit D2).
      payload.bmdc_registration_no = profileData.licenseNumber;
      if (profileData.hospitalName?.trim()) payload.hospital_name = profileData.hospitalName.trim();
    } else {
      payload.date_of_birth = profileData.dateOfBirth;
      payload.blood_group = profileData.bloodGroup;
      payload.height_cm = profileData.heightCm;
      payload.weight_kg = profileData.weightKg;
      payload.allergies = profileData.allergies;
      payload.chronic_conditions = profileData.chronicConditions;
    }

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
  },

  /**
   * Updates user profile data
   */
  async updateProfile(data: Record<string, any>): Promise<User> {
    const response = (await axiosClient.put('/user/me', data)) as any;
    return response.user || response;
  },

  /** Changing the login number: a code goes to the new number first (audit F12). */
  async sendPhoneChangeCode(phone: string): Promise<void> {
    await axiosClient.post('/user/me/phone/send-otp', { phone });
  },

  /** Confirms the code; the server then switches the number and returns the user. */
  async confirmPhoneChange(phone: string, otp: string): Promise<User> {
    const response = (await axiosClient.post('/user/me/phone/verify', { phone, otp })) as any;
    return response.user || response;
  },

  /**
   * Uploads user avatar image
   */
  async uploadAvatar(fileUri: string): Promise<string> {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: fileUri,
      name: filename,
      type,
    } as any);

    const response = (await axiosClient.post('/user/avatar', formData, {
      timeout: 60000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as any;

    return response.avatarUrl;
  },
};
