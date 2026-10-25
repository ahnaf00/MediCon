import { Colors } from '@theme';
import type { AccountRole, AdminUser } from '../../services/api/adminService';

export const ROLE_LABEL: Record<AccountRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Admin',
};

/** A word and colour for anything other than an active account; null when active. */
export const statusBadge = (
  u: Pick<AdminUser, 'status' | 'deletedAt'>,
): { label: string; color: string } | null =>
  u.deletedAt
    ? { label: 'Deleted', color: Colors.textSecondary }
    : u.status === 'suspended'
      ? { label: 'Suspended', color: Colors.danger }
      : u.status === 'pending'
        ? { label: 'Pending', color: '#9a6700' }
        : null;
