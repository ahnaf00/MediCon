// src/services/api/adminService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin API (audit L2), admin accounts only:
//   GET  /admin/summary                  → { doctors: { pending, verified, rejected } }
//   GET  /admin/doctors?status=…         → doctor registrations (default pending)
//   GET  /admin/doctors/{id}
//   POST /admin/doctors/{id}/approve
//   POST /admin/doctors/{id}/reject { reason }
// Admin dashboard (audit L2b). Records only, never medical content:
//   GET  /admin/overview                 → counts for the Overview tab
//   GET  /admin/users?q=&role=&status=   → accounts (status `deleted` = in the 30-day window)
//   GET  /admin/users/{id}
//   POST /admin/users/{id}/suspend { reason } · POST /admin/users/{id}/reactivate
//   GET  /admin/audit-log?target_id=     → every admin action, newest first
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

// ── Dashboard (audit L2b) ───────────────────────────────────────────────────

export type VisitStatus =
  'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired';

export interface AdminOverview {
  users: {
    patients: number;
    doctors: number;
    newThisWeek: number;
    suspended: number;
    pendingDeletion: number;
  };
  doctors: Record<DoctorReviewStatus, number> & { onlineNow: number };
  visitsToday: Record<VisitStatus, number> & { total: number };
  /** Oldest first; `date` is a Dhaka calendar day (YYYY-MM-DD). */
  visitsByDay: { date: string; total: number }[];
  transcripts: { failed: number };
  ai: { requestsToday: number };
  generatedAt: string;
}

export type AccountRole = 'patient' | 'doctor' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type AccountFilter = AccountStatus | 'deleted';

export interface AdminUser {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  role: AccountRole | null;
  status: AccountStatus;
  joinedAt: string | null;
  lastActiveAt: string | null;
  deletedAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  suspension: { reason: string | null; at: string | null; by: string | null } | null;
  purgeAt: string | null;
  visits: { total: number; upcoming: number; completed: number };
  doctor: { specialty: string | null; verificationStatus: DoctorReviewStatus } | null;
}

export type AuditAction =
  'doctor.approved' | 'doctor.rejected' | 'user.suspended' | 'user.reactivated';

export interface AuditEntry {
  id: number;
  action: AuditAction | string;
  admin: string | null;
  target: { id: number; name: string } | null;
  reason: string | null;
  meta: Record<string, unknown> | null;
  at: string;
}

export interface UserFilters {
  q?: string;
  role?: AccountRole;
  status?: AccountFilter;
}

export const adminDashboardService = {
  overview: async (): Promise<AdminOverview> =>
    (await axiosClient.get('/admin/overview')) as unknown as AdminOverview,

  users: async (filters: UserFilters): Promise<AdminUser[]> =>
    getAllPages<AdminUser>('/admin/users', {
      q: filters.q?.trim() || undefined,
      role: filters.role,
      status: filters.status,
    }),

  user: async (id: string): Promise<AdminUserDetail> =>
    (await axiosClient.get(`/admin/users/${id}`)) as unknown as AdminUserDetail,

  suspend: async ({ id, reason }: { id: number; reason: string }): Promise<void> => {
    await axiosClient.post(`/admin/users/${id}/suspend`, { reason });
  },

  reactivate: async (id: number): Promise<void> => {
    await axiosClient.post(`/admin/users/${id}/reactivate`);
  },

  auditLog: async (targetId?: string): Promise<AuditEntry[]> =>
    getAllPages<AuditEntry>('/admin/audit-log', { target_id: targetId || undefined }),
};

export const useAdminOverview = () =>
  useQuery({ queryKey: [...ADMIN_KEY, 'overview'], queryFn: adminDashboardService.overview });

export const useAdminUsers = (filters: UserFilters) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'users', filters],
    queryFn: () => adminDashboardService.users(filters),
  });

export const useAdminUser = (id: string | undefined) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'user', id],
    queryFn: () => adminDashboardService.user(id as string),
    enabled: !!id,
  });

export const useAuditLog = (targetId?: string) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'audit-log', targetId ?? 'all'],
    queryFn: () => adminDashboardService.auditLog(targetId),
  });

export const useSuspendUser = () => useAdminMutation(adminDashboardService.suspend);
export const useReactivateUser = () => useAdminMutation(adminDashboardService.reactivate);

/** "3 min ago", "5 h ago", "2 days ago", or a date for anything older than a week. */
export const timeAgo = (iso: string | null | undefined, now: Date = new Date()): string => {
  if (!iso) return 'never';
  const then = new Date(iso);
  const minutes = Math.round((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? 'yesterday' : `${days} days ago`;
  return then.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Words for an audit-log row, e.g. "Suspended Rahat Ahmed". */
export const describeAudit = (e: AuditEntry): string => {
  const who = e.target?.name ?? 'an account';
  switch (e.action) {
    case 'doctor.approved':
      return `Approved doctor ${who}`;
    case 'doctor.rejected':
      return `Rejected doctor ${who}`;
    case 'user.suspended':
      return `Suspended ${who}`;
    case 'user.reactivated':
      return `Reactivated ${who}`;
    default:
      return `${e.action} ${who}`;
  }
};
