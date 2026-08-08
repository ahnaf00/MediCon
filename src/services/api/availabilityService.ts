import { axiosClient } from './axiosClient';

export interface ApiSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export type ExceptionType = 'disabled' | 'added';

export interface ExceptionsResponse {
  [date: string]: {
    disabled: string[];
    added: string[];
  };
}

export const availabilityService = {
  getSchedule: async (): Promise<ApiSchedule[]> => {
    const res = await axiosClient.get('/doctor/availability');
    return res as unknown as ApiSchedule[];
  },

  updateSchedule: async (schedule: ApiSchedule[]): Promise<void> => {
    await axiosClient.put('/doctor/availability', { schedule });
  },

  getExceptions: async (startDate?: string, endDate?: string): Promise<ExceptionsResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const url = `/doctor/exceptions${params.toString() ? '?' + params.toString() : ''}`;
    const res = await axiosClient.get(url);
    return res as unknown as ExceptionsResponse;
  },

  toggleException: async (date: string, time: string, type: ExceptionType, action: 'add' | 'remove'): Promise<void> => {
    await axiosClient.post('/doctor/exceptions/toggle', {
      date,
      time,
      type,
      action
    });
  }
};
