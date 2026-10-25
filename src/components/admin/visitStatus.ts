import { Colors } from '@theme';
import type { VisitStatus } from '../../services/api/adminService';

/** Text colour for a visit's status word on the admin Visits screens. */
export const VISIT_STATUS_COLOR: Record<VisitStatus, string> = {
  scheduled: Colors.primary,
  in_progress: '#9a6700',
  completed: Colors.success,
  cancelled: Colors.textSecondary,
  no_show: Colors.danger,
  expired: Colors.textTertiary,
};

export const FORMAT_LABEL = { video: 'Video', in_person: 'In person' } as const;
