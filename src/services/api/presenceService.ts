// src/services/api/presenceService.ts
// ─────────────────────────────────────────────────────────────────────────────
// The doctor's own "Online" status.
//   GET  /doctor/presence            → { isOnline, lastSeenAt }
//   POST /doctor/presence            → { is_online } → { isOnline, lastSeenAt }
//   POST /doctor/presence/heartbeat  → keep-alive; never switches a doctor on
// The server drops a doctor offline 5 minutes after the last heartbeat.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';

export interface DoctorPresence {
  isOnline: boolean;
  /** UTC ISO-8601 with offset; null until the doctor first toggles. */
  lastSeenAt: string | null;
}

const PRESENCE_KEY = ['doctor-presence'];
const HEARTBEAT_KEY = ['doctor-presence-heartbeat'];
/** Well inside the server's 5-minute window, so one missed beat doesn't drop the doctor. */
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

export const presenceService = {
  getPresence: async (): Promise<DoctorPresence> =>
    (await axiosClient.get('/doctor/presence')) as unknown as DoctorPresence,

  setPresence: async (isOnline: boolean): Promise<DoctorPresence> =>
    (await axiosClient.post('/doctor/presence', {
      is_online: isOnline,
    })) as unknown as DoctorPresence,

  heartbeat: async (signal?: AbortSignal): Promise<DoctorPresence> =>
    (await axiosClient.post('/doctor/presence/heartbeat', null, {
      signal,
    })) as unknown as DoctorPresence,
};

/** Whether the app is in the foreground. */
const useAppIsActive = (): boolean => {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
};

/**
 * The persisted Online toggle. Flips optimistically and rolls back if the save fails,
 * so the switch never shows a state the server didn't accept. While online and in the
 * foreground it sends a heartbeat (shared across every screen using this hook); once
 * the app is closed or backgrounded the beats stop and the server lets presence lapse.
 */
export const useDoctorPresence = () => {
  const qc = useQueryClient();
  const appActive = useAppIsActive();

  const query = useQuery({
    queryKey: PRESENCE_KEY,
    queryFn: presenceService.getPresence,
  });

  const mutation = useMutation({
    mutationFn: presenceService.setPresence,
    onMutate: async (isOnline: boolean) => {
      await qc.cancelQueries({ queryKey: PRESENCE_KEY });
      await qc.cancelQueries({ queryKey: HEARTBEAT_KEY });
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

  const isOnline = query.data?.isOnline ?? false;

  // Coming back to the foreground: presence may have lapsed meanwhile, so re-read it.
  const wasActive = useRef(appActive);
  useEffect(() => {
    if (appActive && !wasActive.current) {
      qc.invalidateQueries({ queryKey: PRESENCE_KEY });
    }
    wasActive.current = appActive;
  }, [appActive, qc]);

  useQuery({
    queryKey: HEARTBEAT_KEY,
    queryFn: async ({ signal }) => {
      const presence = await presenceService.heartbeat(signal);
      // If the server already let presence lapse, this turns the switch off too.
      qc.setQueryData(PRESENCE_KEY, presence);
      return presence;
    },
    enabled: isOnline && appActive && !mutation.isPending,
    refetchInterval: HEARTBEAT_INTERVAL_MS,
    staleTime: HEARTBEAT_INTERVAL_MS,
    gcTime: 0,
    retry: false,
  });

  return {
    isOnline,
    /** False until the saved state has loaded, or while a change is saving. */
    canToggle: query.isSuccess && !mutation.isPending,
    toggle: () => mutation.mutate(!isOnline),
  };
};
