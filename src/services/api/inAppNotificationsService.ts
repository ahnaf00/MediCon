// src/services/api/inAppNotificationsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// In-app notifications (audit L5). Not phone push, and not the medicine reminders
// in src/services/notifications.
//   GET  /notifications                → mine, newest first (paginated)
//   GET  /notifications/unread-count   → { unreadCount }
//   POST /notifications/{id}/read
//   POST /notifications/read-all
// There is no live connection, so the unread count is re-checked while the app is open.
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { getAllPages } from './pagination';

export type NoticeKind =
  | 'question_answered'
  | 'chat_message'
  | 'report_ready'
  | 'report_failed'
  | 'summary_shared'
  | 'visit_reminder'
  | 'account_reviewed'
  | 'other';

export interface NoticeTarget {
  conversation_id?: number;
  record_id?: number;
  appointment_id?: number;
  patient_user_id?: number;
  for?: 'patient' | 'doctor';
  status?: string;
}

export interface AppNotice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  target: NoticeTarget;
  readAt: string | null;
  createdAt: string;
}

/** The screen a notification opens, or null when there is nothing to open. */
export const noticeRoute = (n: AppNotice): string | null => {
  const t = n.target ?? {};
  switch (n.kind) {
    case 'question_answered':
      return '/(app)/(tabs)/ask-doctor';
    case 'chat_message':
      return t.conversation_id ? `/(app)/chat/${t.conversation_id}` : '/(app)/chat';
    case 'report_ready':
    case 'report_failed':
      return t.record_id ? `/(app)/report/${t.record_id}` : null;
    case 'summary_shared':
      return t.appointment_id ? `/(app)/ai-chat/consultation/${t.appointment_id}` : null;
    case 'visit_reminder':
      if (t.for === 'doctor' && t.patient_user_id) {
        return `/(app)/doctor/consultation/${t.patient_user_id}?appointmentId=${t.appointment_id}`;
      }
      return '/(app)/doctors/history';
    case 'account_reviewed':
      return '/(app)/(tabs)';
    default:
      return null;
  }
};

export const inAppNotificationsService = {
  list: async (): Promise<AppNotice[]> => getAllPages<AppNotice>('/notifications'),

  unreadCount: async (): Promise<number> => {
    const res: any = await axiosClient.get('/notifications/unread-count');
    return typeof res?.unreadCount === 'number' ? res.unreadCount : 0;
  },

  markRead: async (id: string): Promise<void> => {
    await axiosClient.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await axiosClient.post('/notifications/read-all');
  },
};

const LIST_KEY = ['in-app-notifications'];
const COUNT_KEY = ['in-app-notifications-unread'];

export const useInAppNotifications = () =>
  useQuery({ queryKey: LIST_KEY, queryFn: inAppNotificationsService.list });

export const useUnreadNoticeCount = () =>
  useQuery({
    queryKey: COUNT_KEY,
    queryFn: inAppNotificationsService.unreadCount,
    refetchInterval: 30000,
  });

const useRefreshAfter = <T>(fn: (arg: T) => Promise<void>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      qc.invalidateQueries({ queryKey: COUNT_KEY });
    },
  });
};

export const useMarkNoticeRead = () => useRefreshAfter(inAppNotificationsService.markRead);

export const useMarkAllNoticesRead = () =>
  useRefreshAfter((_: void) => inAppNotificationsService.markAllRead());
