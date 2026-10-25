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
//   GET  /admin/doctors?status=all&q=&online=1 → doctors directory (step 2)
//   GET  /admin/visits?from=&to=&status= → visits on Dhaka days (view only, step 2)
//   GET  /admin/visits/{id}
// Step 3 (hospitals, system health) lives in adminSystemService.ts.
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
  isOnline: boolean;
  accountStatus: 'active' | 'suspended' | 'pending';
  visits: { completed: number; upcoming: number };
}

export interface AdminSummary {
  doctors: Record<DoctorReviewStatus, number>;
}

export const adminService = {
  summary: async (): Promise<AdminSummary> =>
    (await axiosClient.get('/admin/summary')) as unknown as AdminSummary,

  doctors: async (status: DoctorReviewStatus): Promise<AdminDoctor[]> =>
    getAllPages<AdminDoctor>('/admin/doctors', { status }),

  directory: async ({ q, online }: { q?: string; online?: boolean }): Promise<AdminDoctor[]> =>
    getAllPages<AdminDoctor>('/admin/doctors', {
      status: 'all',
      q: q?.trim() || undefined,
      online: online ? 1 : undefined,
    }),

  doctor: async (id: string): Promise<AdminDoctor> =>
    (await axiosClient.get(`/admin/doctors/${id}`)) as unknown as AdminDoctor,

  approve: async (id: number): Promise<void> => {
    await axiosClient.post(`/admin/doctors/${id}/approve`);
  },

  reject: async ({ id, reason }: { id: number; reason: string }): Promise<void> => {
    await axiosClient.post(`/admin/doctors/${id}/reject`, { reason });
  },
};

/** Every admin query starts with this, so one invalidation refreshes them all. */
export const ADMIN_KEY = ['admin'];

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

export const useAdminMutation = <T>(fn: (arg: T) => Promise<void>) => {
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
  jobs: { failed: number };
  /** Every call to the AI service today, from any feature. */
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
  | 'doctor.approved'
  | 'doctor.rejected'
  | 'user.suspended'
  | 'user.reactivated'
  | 'hospital.created'
  | 'hospital.updated'
  | 'hospital.deactivated'
  | 'hospital.reactivated'
  | 'transcript.retried'
  | 'job.retried'
  | 'job.discarded';

export type AuditTargetType = 'user' | 'hospital' | 'visit';

export interface AuditEntry {
  id: number;
  action: AuditAction | string;
  admin: string | null;
  target: { type?: AuditTargetType; id: number; name: string } | null;
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

  /** Every action, or those on one target; the type defaults to an account. */
  auditLog: async (targetId?: string, targetType?: AuditTargetType): Promise<AuditEntry[]> =>
    getAllPages<AuditEntry>('/admin/audit-log', {
      target_id: targetId || undefined,
      target_type: targetId ? targetType : undefined,
    }),
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

export const useAuditLog = (targetId?: string, targetType?: AuditTargetType) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'audit-log', targetType ?? 'user', targetId ?? 'all'],
    queryFn: () => adminDashboardService.auditLog(targetId, targetType),
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
    case 'hospital.created':
      return `Added hospital ${who}`;
    case 'hospital.updated':
      return `Edited hospital ${who}`;
    case 'hospital.deactivated':
      return `Hid hospital ${who} from patients`;
    case 'hospital.reactivated':
      return `Showed hospital ${who} to patients again`;
    case 'transcript.retried':
      return `Retried the call transcript of ${e.target?.name ?? 'a visit'}`;
    case 'job.retried':
      return `Retried failed job ${String(e.meta?.job ?? '')}`.trim();
    case 'job.discarded':
      return `Discarded failed job ${String(e.meta?.job ?? '')}`.trim();
    default:
      return `${e.action} ${who}`;
  }
};

// ── Step 2: doctors directory and visits (audit L2b) ────────────────────────

export const useDoctorDirectory = (filters: { q?: string; online?: boolean }) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'directory', filters],
    queryFn: () => adminService.directory(filters),
  });

export interface AdminVisit {
  id: number;
  at: string;
  durationMinutes: number;
  format: 'video' | 'in_person';
  status: VisitStatus;
  patient: { id: number | null; name: string };
  doctor: { id: number | null; name: string; specialty: string | null };
}

/** Records only: whether a prescription or transcript exists, never their content. */
export interface AdminVisitDetail extends AdminVisit {
  bookedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  hasPrescription: boolean;
  transcriptStatus: string | null;
}

/** Clinic-timezone (Asia/Dhaka) calendar days, inclusive, as YYYY-MM-DD. */
export interface VisitFilters {
  from: string;
  to: string;
  status?: VisitStatus;
}

export const adminVisitsService = {
  visits: async ({ from, to, status }: VisitFilters): Promise<AdminVisit[]> =>
    getAllPages<AdminVisit>('/admin/visits', { from, to, status }),

  visit: async (id: string): Promise<AdminVisitDetail> =>
    (await axiosClient.get(`/admin/visits/${id}`)) as unknown as AdminVisitDetail,
};

export const useAdminVisits = (filters: VisitFilters) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'visits', filters],
    queryFn: () => adminVisitsService.visits(filters),
  });

export const useAdminVisit = (id: string | undefined) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'visit', id],
    queryFn: () => adminVisitsService.visit(id as string),
    enabled: !!id,
  });

// Bangladesh has no daylight saving, so Dhaka time is always UTC+6.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The Dhaka calendar day `offsetDays` from now, as YYYY-MM-DD. */
export const dhakaDay = (offsetDays = 0, now: Date = new Date()): string => {
  const d = new Date(now.getTime() + DHAKA_OFFSET_MS + offsetDays * DAY_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/** A visit's clock time in Dhaka, e.g. "9:30 AM", on any phone timezone. */
export const dhakaTime = (iso: string): string => {
  const d = new Date(new Date(iso).getTime() + DHAKA_OFFSET_MS);
  const h = d.getUTCHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** A visit's Dhaka date, e.g. "Sun 25 Oct". */
export const dhakaDateLabel = (iso: string): string => {
  const d = new Date(new Date(iso).getTime() + DHAKA_OFFSET_MS);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
};

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  scheduled: 'Booked',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
  expired: 'Expired',
};
