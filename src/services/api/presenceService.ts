// src/services/api/presenceService.ts
// ─────────────────────────────────────────────────────────────────────────────
// The doctor's own "Online" status.
//   GET  /doctor/presence  → { isOnline, lastSeenAt }
//   POST /doctor/presence  → { is_online } → { isOnline, lastSeenAt }
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';

export interface DoctorPresence {
  isOnline: boolean;
  /** UTC ISO-8601 with offset; null until the doctor first toggles. */
  lastSeenAt: string | null;
}

const PRESENCE_KEY = ['doctor-presence'];

export const presenceService = {
  getPresence: async (): Promise<DoctorPresence> =>
    (await axiosClient.get('/doctor/presence')) as unknown as DoctorPresence,

  setPresence: async (isOnline: boolean): Promise<DoctorPresence> =>
    (await axiosClient.post('/doctor/presence', {
      is_online: isOnline,
    })) as unknown as DoctorPresence,
};

/**
 * The persisted Online toggle. Flips optimistically and rolls back if the save fails,
 * so the switch never shows a state the server didn't accept.
 */
export const useDoctorPresence = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: PRESENCE_KEY,
    queryFn: presenceService.getPresence,
  });

  const mutation = useMutation({
    mutationFn: presenceService.setPresence,
    onMutate: async (isOnline: boolean) => {
      await qc.cancelQueries({ queryKey: PRESENCE_KEY });
      const previous = qc.getQueryData<DoctorPresence>(PRESENCE_KEY);
      qc.setQueryData<DoctorPresence>(PRESENCE_KEY, {
        isOnline,
        lastSeenAt: previous?.lastSeenAt ?? null,
      });
      return { previous };
    },
    onError: (_err, _isOnline, context) => {
      if (context?.previous) qc.setQueryData(PRESENCE_KEY, context.previous);
    },
    onSuccess: (presence) => qc.setQueryData(PRESENCE_KEY, presence),
  });

  return {
    isOnline: query.data?.isOnline ?? false,
    /** False until the saved state has loaded, or while a change is saving. */
    canToggle: query.isSuccess && !mutation.isPending,
    toggle: () => mutation.mutate(!(query.data?.isOnline ?? false)),
  };
};
