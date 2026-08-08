import { axiosClient } from './axiosClient';

export interface DoctorDashboardStats {
  fees: {
    consultation_fee: number;
    follow_up_fee: number;
  };
  time_metrics: {
    avg_all_time_mins: number;
    avg_this_month_mins: number;
  };
  earnings: {
    today: number;
    this_month: number;
    previous_month: number;
  };
  today_appointments_count: number;
}

export const dashboardService = {
  /**
   * Fetches aggregated dashboard stats for the authenticated doctor.
   */
  async getDoctorStats(): Promise<DoctorDashboardStats> {
    const response = (await axiosClient.get('/doctor/dashboard')) as any;
    // Note: the interceptor might unwrap it. The backend returns a direct JSON object (not wrapped in 'data').
    // So response itself will be the stats object.
    return response as DoctorDashboardStats;
  }
};
