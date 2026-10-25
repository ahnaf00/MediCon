// src/services/api/adminService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin API (audit L2), admin accounts only:
//   GET  /admin/summary                  → { doctors: { pending, verified, rejected } }
//   GET  /admin/doctors?status=…         → doctor registrations (default pending)
//   GET  /admin/doctors/{id}
//   POST /admin/doctors/{id}/approve
//   POST /admin/doctors/{id}/reject { reason }
// The later admin dashboard adds its sections here.
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { getAllPages } from './pagination';

export type DoctorReviewStatus = 'pending' | 'verified' | 'rejected';

export interface AdminDoctor {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  registeredAt: string | null;
  specialty: string | null;
  qualification: string | null;
  bmdcRegistrationNo: string | null;
  hospitalName: string | null;
  experienceYears: number;
  verificationStatus: DoctorReviewStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface AdminSummary {
  doctors: Record<DoctorReviewStatus, number>;
}

export const adminService = {
  summary: async (): Promise<AdminSummary> =>
    (await axiosClient.get('/admin/summary')) as unknown as AdminSummary,

  doctors: async (status: DoctorReviewStatus): Promise<AdminDoctor[]> =>
    getAllPages<AdminDoctor>('/admin/doctors', { status }),

  doctor: async (id: string): Promise<AdminDoctor> =>
    (await axiosClient.get(`/admin/doctors/${id}`)) as unknown as AdminDoctor,

  approve: async (id: number): Promise<void> => {
    await axiosClient.post(`/admin/doctors/${id}/approve`);
  },

  reject: async ({ id, reason }: { id: number; reason: string }): Promise<void> => {
    await axiosClient.post(`/admin/doctors/${id}/reject`, { reason });
  },
};

const ADMIN_KEY = ['admin'];

export const useAdminSummary = () =>
  useQuery({ queryKey: [...ADMIN_KEY, 'summary'], queryFn: adminService.summary });

export const useAdminDoctors = (status: DoctorReviewStatus) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'doctors', status],
    queryFn: () => adminService.doctors(status),
  });

export const useAdminDoctor = (id: string | undefined) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'doctor', id],
    queryFn: () => adminService.doctor(id as string),
    enabled: !!id,
  });

const useAdminMutation = <T>(fn: (arg: T) => Promise<void>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
};

export const useApproveDoctor = () => useAdminMutation(adminService.approve);
export const useRejectDoctor = () => useAdminMutation(adminService.reject);
