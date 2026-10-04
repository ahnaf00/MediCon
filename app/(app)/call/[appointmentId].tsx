// Video consultation screen (Phase 6), shared by the doctor and the patient.
//
//  pre-join → consent + camera/mic choice → POST consent → POST token → in call
//
// The "● Recording" badge is driven only by the transcriber agent's own
// `recording` attribute, which is true only while it is actually writing audio.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  VideoView,
  isTrackReference,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from '@livekit/react-native';
import {
  ConnectionState,
  DisconnectReason,
  LocalVideoTrack,
  Room,
  RoomEvent,
  Track,
  createLocalVideoTrack,
  type RemoteParticipant,
} from 'livekit-client';
import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '../../../src/theme';
import { useAuthStore } from '../../../src/store';
import { apiErrorMessage, useAppointments } from '../../../src/services/api/consultationsService';
import {
  type CallSession,
  useCallConsent,
  useCallToken,
  useEndCall,
} from '../../../src/services/api/callsService';

type Role = 'doctor' | 'patient';
type EndState = { kind: 'ended' } | { kind: 'disconnected' } | { kind: 'duplicate' };

export default function CallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const storedRole: Role = useAuthStore((s) => s.role) === 'doctor' ? 'doctor' : 'patient';
  // The server says which side of this appointment the caller is; prefer it once known.
  const [serverRole, setServerRole] = useState<Role | null>(null);
  const role = serverRole ?? storedRole;

  const { data: appointments } = useAppointments();
  const appointment = appointments?.find((a) => String(a.id) === String(appointmentId));
  const otherName =
    (role === 'doctor' ? appointment?.patient?.name : appointment?.doctor?.name) ?? null;

  const [session, setSession] = useState<CallSession | null>(null);
  const [endState, setEndState] = useState<EndState | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [consent, setConsent] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const consentMutation = useCallConsent();
  const tokenMutation = useCallToken();
  const joining = consentMutation.isPending || tokenMutation.isPending;

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)');
  }, [router]);

  const join = async () => {
    if (!appointmentId) return;
    setJoinError(null);
    try {
      // Consent first, so the token carries the participant's current choice.
      const res = await consentMutation.mutateAsync({ appointmentId, consent });
      setServerRole(res.role);
      const s = await tokenMutation.mutateAsync({ appointmentId });
      await AudioSession.startAudioSession();
      setEndState(null);
      setSession(s);
    } catch (err) {
      setJoinError(apiErrorMessage(err, t('call.join_error')));
    }
  };

  const onCallFinished = useCallback(
    (state: EndState | null) => {
      setSession(null);
      AudioSession.stopAudioSession().catch(() => {});
      qc.invalidateQueries({ queryKey: ['appointments'] });
      if (state) setEndState(state);
      else close();
    },
    [qc, close],
  );

  // Make sure audio routing is released if the screen goes away mid-call.
  useEffect(() => () => void AudioSession.stopAudioSession().catch(() => {}), []);

  if (session && appointmentId) {
    return (
      <InCall
        appointmentId={appointmentId}
        session={session}
        role={role}
        otherName={otherName}
        initialMic={micOn}
        initialCam={camOn}
        initialConsent={consent}
        onConsentChanged={setConsent}
        onFinished={onCallFinished}
      />
    );
  }

  if (endState) {
    return (
      <SafeAreaView style={styles.darkContainer}>
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name={endState.kind === 'ended' ? 'check-circle-outline' : 'lan-disconnect'}
            size={64}
            color={Colors.surface}
          />
          <Text style={styles.endTitle}>
            {endState.kind === 'ended' ? t('call.ended_title') : t('call.disconnected_title')}
          </Text>
          <Text style={styles.endBody}>
            {endState.kind === 'ended'
              ? t('call.ended_body')
              : endState.kind === 'duplicate'
                ? t('call.duplicate_body')
                : t('call.disconnected_body')}
          </Text>
          {endState.kind !== 'ended' && (
            <TouchableOpacity style={styles.primaryButton} onPress={() => setEndState(null)}>
              <Text style={styles.primaryButtonText}>{t('call.rejoin')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.ghostButton} onPress={close}>
            <Text style={styles.ghostButtonText}>{t('call.close')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PreJoin
      role={role}
      otherName={otherName}
      micOn={micOn}
      camOn={camOn}
      consent={consent}
      joining={joining}
      error={joinError}
      onToggleMic={() => setMicOn((v) => !v)}
      onToggleCam={() => setCamOn((v) => !v)}
      onConsentChange={setConsent}
      onJoin={join}
      onClose={close}
    />
  );
}

// ─── Pre-join sheet ─────────────────────────────────────────────────────────

function PreJoin(props: {
  role: Role;
  otherName: string | null;
  micOn: boolean;
  camOn: boolean;
  consent: boolean;
  joining: boolean;
  error: string | null;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onConsentChange: (v: boolean) => void;
  onJoin: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const preview = useCameraPreview(props.camOn);

  return (
    <SafeAreaView style={styles.darkContainer}>
      <View style={styles.preJoinHeader}>
        <TouchableOpacity onPress={props.onClose} accessibilityLabel={t('call.close')} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={Colors.surface} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.preJoinTitle}>{t('call.title')}</Text>
          {props.otherName && (
            <Text style={styles.preJoinSubtitle}>
              {t('call.with_name', { name: props.otherName })}
            </Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.preJoinBody}>
        <View style={styles.previewBox}>
          {props.camOn && preview.track ? (
            <VideoView videoTrack={preview.track} style={styles.fill} objectFit="cover" mirror />
          ) : (
            <View style={[styles.fill, styles.centered]}>
              <MaterialCommunityIcons
                name="video-off-outline"
                size={40}
                color={Colors.textTertiary}
              />
              <Text style={styles.previewNote}>
                {props.camOn && preview.failed
                  ? t('call.preview_unavailable')
                  : t('call.camera_off')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.toggleRow}>
          <RoundButton
            icon={props.micOn ? 'microphone' : 'microphone-off'}
            label={props.micOn ? t('call.mute') : t('call.unmute')}
            active={props.micOn}
            onPress={props.onToggleMic}
          />
          <RoundButton
            icon={props.camOn ? 'video' : 'video-off'}
            label={props.camOn ? t('call.camera_turn_off') : t('call.camera_turn_on')}
            active={props.camOn}
            onPress={props.onToggleCam}
          />
        </View>

        <View style={styles.consentCard}>
          <View style={styles.consentHeader}>
            <Text style={styles.consentTitle}>{t('call.consent_title')}</Text>
            <ConsentToggle
              value={props.consent}
              onChange={props.onConsentChange}
              label={t('call.consent_title')}
            />
          </View>
          <Text style={styles.consentBody}>{t('call.consent_body')}</Text>
        </View>

        {props.error && <Text style={styles.errorText}>{props.error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, props.joining && styles.disabled]}
          onPress={props.onJoin}
          disabled={props.joining}
        >
          {props.joining ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {props.role === 'doctor' ? t('call.start_or_join') : t('call.join')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A local camera track for the pre-join preview; stopped when hidden or unmounted. */
function useCameraPreview(enabled: boolean) {
  const [track, setTrack] = useState<LocalVideoTrack | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let created: LocalVideoTrack | null = null;
    createLocalVideoTrack({ facingMode: 'user' })
      .then((tr) => {
        created = tr;
        if (cancelled) tr.stop();
        else setTrack(tr);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      created?.stop();
      setTrack(null);
      setFailed(false);
    };
  }, [enabled]);

  return { track, failed };
}

// ─── In call ────────────────────────────────────────────────────────────────

function InCall(props: {
  appointmentId: string;
  session: CallSession;
  role: Role;
  otherName: string | null;
  initialMic: boolean;
  initialCam: boolean;
  initialConsent: boolean;
  onConsentChanged: (v: boolean) => void;
  onFinished: (state: EndState | null) => void;
}) {
  const room = useMemo(() => new Room({ adaptiveStream: true, dynacast: true }), []);
  const leavingRef = useRef(false);
  // Kept in a ref so a new callback identity never re-runs the effect below,
  // whose cleanup disconnects the call.
  const onFinishedRef = useRef(props.onFinished);
  useLayoutEffect(() => {
    onFinishedRef.current = props.onFinished;
  });

  useEffect(() => {
    const onDisconnected = (reason?: DisconnectReason) => {
      if (leavingRef.current) return; // we left on purpose; leave() navigates
      const finish = onFinishedRef.current;
      if (reason === DisconnectReason.ROOM_DELETED) finish({ kind: 'ended' });
      else if (reason === DisconnectReason.DUPLICATE_IDENTITY) finish({ kind: 'duplicate' });
      else finish({ kind: 'disconnected' });
    };
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      leavingRef.current = true;
      room.disconnect();
    };
  }, [room]);

  const setLeaving = useCallback((v: boolean) => {
    leavingRef.current = v;
  }, []);

  const leave = useCallback(async () => {
    leavingRef.current = true;
    await room.disconnect();
    onFinishedRef.current(null);
  }, [room]);

  return (
    <LiveKitRoom
      room={room}
      serverUrl={props.session.url}
      token={props.session.token}
      connect
      audio={props.initialMic}
      video={props.initialCam ? { facingMode: 'user' } : false}
    >
      <CallView {...props} onLeave={leave} setLeaving={setLeaving} />
    </LiveKitRoom>
  );
}

/** Re-render whenever participants, their attributes, or tracks change. */
function useRoomVersion(room: Room) {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const events = [
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
      RoomEvent.ParticipantAttributesChanged,
      RoomEvent.TrackSubscribed,
      RoomEvent.TrackUnsubscribed,
      RoomEvent.TrackMuted,
      RoomEvent.TrackUnmuted,
    ] as const;
    events.forEach((e) => room.on(e, bump));
    return () => events.forEach((e) => room.off(e, bump));
  }, [room]);
}

function CallView(props: {
  appointmentId: string;
  role: Role;
  otherName: string | null;
  initialConsent: boolean;
  onConsentChanged: (v: boolean) => void;
  onLeave: () => Promise<void>;
  setLeaving: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  useRoomVersion(room);

  const [consent, setConsent] = useState(props.initialConsent);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const consentMutation = useCallConsent();
  const endMutation = useEndCall();

  const remotes = Array.from(room.remoteParticipants.values());
  // The transcriber joins as an agent participant; it is never shown as a person.
  const agent = remotes.find((p) => p.isAgent);
  const other: RemoteParticipant | undefined = remotes.find(
    (p) => !p.isAgent && p.attributes.role !== props.role,
  );
  const recording = agent?.attributes.recording === 'true';
  const otherDeclined = other?.attributes.consent === 'false';

  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const remoteVideo = cameraTracks.find(
    (ref) =>
      isTrackReference(ref) &&
      other &&
      ref.participant.identity === other.identity &&
      !ref.publication.isMuted,
  );
  const localVideo = cameraTracks.find(
    (ref) => isTrackReference(ref) && ref.participant.isLocal && !ref.publication.isMuted,
  );

  const otherLabel =
    props.otherName ?? (props.role === 'doctor' ? t('call.the_patient') : t('call.your_doctor'));

  let statusLine: string;
  if (recording) statusLine = t('call.recording');
  else if (!consent) statusLine = t('call.not_recording_you');
  else if (otherDeclined)
    statusLine =
      props.role === 'doctor' ? t('call.not_recording_patient') : t('call.not_recording_doctor');
  else statusLine = t('call.not_recording');

  const toggleConsent = async (value: boolean) => {
    try {
      const res = await consentMutation.mutateAsync({
        appointmentId: props.appointmentId,
        consent: value,
      });
      setConsent(res.consent);
      props.onConsentChanged(res.consent);
    } catch (err) {
      // A 502 means the choice was saved but the live call didn't get it yet.
      const saved = (err as { response?: { status?: number } })?.response?.status === 502;
      if (saved) {
        setConsent(value);
        props.onConsentChanged(value);
      }
      Alert.alert(t('call.consent_error_title'), apiErrorMessage(err, t('call.consent_error')));
    }
  };

  const flipCamera = async () => {
    const pub = localParticipant.getTrackPublication(Track.Source.Camera);
    const track = pub?.videoTrack as LocalVideoTrack | undefined;
    if (!track) return;
    const next = facing === 'user' ? 'environment' : 'user';
    try {
      await track.restartTrack({ facingMode: next });
      setFacing(next);
    } catch {
      // Device has a single camera; nothing to flip to.
    }
  };

  const endConsultation = async () => {
    // The server deletes the room, which disconnects us; that is expected here.
    props.setLeaving(true);
    try {
      await endMutation.mutateAsync({ appointmentId: props.appointmentId });
    } catch (err) {
      props.setLeaving(false);
      Alert.alert(t('call.end_error_title'), apiErrorMessage(err, t('call.end_error')));
      return;
    }
    setLeaveOpen(false);
    await props.onLeave();
  };

  const reconnecting =
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.SignalReconnecting;
  const connecting = connectionState === ConnectionState.Connecting;

  return (
    <View style={styles.callContainer}>
      {/* Remote video, full screen */}
      {remoteVideo && isTrackReference(remoteVideo) ? (
        <VideoTrack trackRef={remoteVideo} style={styles.fill} objectFit="cover" />
      ) : (
        <View style={[styles.fill, styles.centered]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(other?.name || props.otherName)}</Text>
          </View>
          <Text style={styles.waitingText}>
            {connecting
              ? t('call.connecting')
              : other
                ? t('call.camera_off_other', { name: otherLabel })
                : t('call.waiting_for', { name: otherLabel })}
          </Text>
        </View>
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Top: recording status + reconnecting banner */}
        <View style={styles.topBar} pointerEvents="box-none">
          <View style={[styles.statusPill, recording && styles.statusPillRecording]}>
            {recording && <View style={styles.recordDot} />}
            <Text style={styles.statusText}>{statusLine}</Text>
          </View>
          {reconnecting && (
            <View style={styles.reconnectBanner}>
              <ActivityIndicator size="small" color={Colors.surface} />
              <Text style={styles.statusText}>{t('call.reconnecting')}</Text>
            </View>
          )}
        </View>

        {/* Local picture-in-picture */}
        <View style={styles.pip}>
          {isCameraEnabled && localVideo && isTrackReference(localVideo) ? (
            <VideoTrack
              trackRef={localVideo}
              style={styles.fill}
              objectFit="cover"
              mirror={facing === 'user'}
              zOrder={1}
            />
          ) : (
            <View style={[styles.fill, styles.centered]}>
              <MaterialCommunityIcons name="video-off" size={22} color={Colors.textTertiary} />
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <RoundButton
            icon={isMicrophoneEnabled ? 'microphone' : 'microphone-off'}
            label={isMicrophoneEnabled ? t('call.mute') : t('call.unmute')}
            active={isMicrophoneEnabled}
            onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          />
          <RoundButton
            icon={isCameraEnabled ? 'video' : 'video-off'}
            label={isCameraEnabled ? t('call.camera_turn_off') : t('call.camera_turn_on')}
            active={isCameraEnabled}
            onPress={() =>
              localParticipant.setCameraEnabled(!isCameraEnabled, { facingMode: facing })
            }
          />
          <RoundButton
            icon="camera-flip-outline"
            label={t('call.flip_camera')}
            active
            disabled={!isCameraEnabled}
            onPress={flipCamera}
          />
          <RoundButton
            icon="dots-horizontal"
            label={t('call.more_options')}
            active
            onPress={() => setMenuOpen(true)}
          />
          <RoundButton
            icon="phone-hangup"
            label={t('call.leave')}
            danger
            onPress={() => (props.role === 'doctor' ? setLeaveOpen(true) : props.onLeave())}
          />
        </View>
      </SafeAreaView>

      {/* Overflow menu: recording consent */}
      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={styles.consentHeader}>
          <Text style={styles.sheetTitle}>{t('call.consent_title')}</Text>
          <ConsentToggle
            value={consent}
            disabled={consentMutation.isPending}
            onChange={toggleConsent}
            label={t('call.consent_title')}
          />
        </View>
        <Text style={styles.sheetBody}>{t('call.consent_body')}</Text>
      </Sheet>

      {/* Doctor's leave sheet */}
      <Sheet visible={leaveOpen} onClose={() => setLeaveOpen(false)}>
        <TouchableOpacity style={styles.sheetOption} onPress={props.onLeave}>
          <Text style={styles.sheetOptionTitle}>{t('call.leave')}</Text>
          <Text style={styles.sheetBody}>{t('call.leave_hint')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sheetOption, endMutation.isPending && styles.disabled]}
          onPress={endConsultation}
          disabled={endMutation.isPending}
        >
          {endMutation.isPending ? (
            <ActivityIndicator color={Colors.danger} />
          ) : (
            <>
              <Text style={[styles.sheetOptionTitle, { color: Colors.danger }]}>
                {t('call.end_consultation')}
              </Text>
              <Text style={styles.sheetBody}>{t('call.end_consultation_hint')}</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetCancel} onPress={() => setLeaveOpen(false)}>
          <Text style={styles.sheetCancelText}>{t('call.cancel')}</Text>
        </TouchableOpacity>
      </Sheet>
    </View>
  );
}

// ─── Small pieces ───────────────────────────────────────────────────────────

function RoundButton(props: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      style={[
        styles.roundButton,
        !props.active && styles.roundButtonOff,
        props.danger && styles.roundButtonDanger,
        props.disabled && styles.disabled,
      ]}
    >
      <MaterialCommunityIcons
        name={props.icon}
        size={24}
        color={props.active || props.danger ? Colors.surface : Colors.textPrimary}
      />
    </TouchableOpacity>
  );
}

/**
 * On/off control for recording consent. Deliberately not RN's <Switch>: on
 * Android its native change event was observed firing with no user input
 * (Phase 6.3 testing), and consent must only ever change on a real tap.
 * Pressable's onPress fires only for a touch or an accessibility activation.
 */
function ConsentToggle(props: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => props.onChange(!props.value)}
      disabled={props.disabled}
      accessibilityRole="switch"
      accessibilityLabel={props.label}
      accessibilityState={{ checked: props.value, disabled: !!props.disabled }}
      hitSlop={10}
      style={[
        styles.toggleTrack,
        props.value && styles.toggleTrackOn,
        props.disabled && styles.disabled,
      ]}
    >
      <View style={[styles.toggleThumb, props.value && styles.toggleThumbOn]} />
    </Pressable>
  );
}

function Sheet(props: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={props.onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {props.children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name
    .replace(/^Dr\.?\s+/i, '')
    .trim()
    .split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const styles = StyleSheet.create({
  darkContainer: { flex: 1, backgroundColor: '#0B1620' },
  callContainer: { flex: 1, backgroundColor: '#0B1620' },
  fill: { flex: 1, alignSelf: 'stretch' },
  centered: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'space-between',
  },

  preJoinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  preJoinTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.surface },
  preJoinSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textTertiary,
  },
  preJoinBody: { padding: Spacing.base, gap: Spacing.base },
  previewBox: {
    height: 300,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#18232E',
  },
  previewNote: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl },

  consentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  consentTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  consentBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: '#FF8A9A',
    textAlign: 'center',
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
  primaryButtonText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.surface },
  ghostButton: { padding: Spacing.md, marginTop: Spacing.sm },
  ghostButtonText: { fontFamily: FontFamily.bold, fontSize: FontSize.md, color: Colors.surface },
  disabled: { opacity: 0.5 },

  endTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.surface,
    marginTop: Spacing.base,
  },
  endBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, color: Colors.surface },
  waitingText: {
    marginTop: Spacing.base,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.surface,
    textAlign: 'center',
  },

  topBar: { alignItems: 'center', paddingTop: Spacing.sm, gap: Spacing.sm },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusPillRecording: { backgroundColor: 'rgba(208,42,65,0.85)' },
  recordDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surface },
  statusText: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.surface },
  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(245,158,11,0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },

  pip: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 120,
    width: 104,
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#18232E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  roundButtonOff: { backgroundColor: Colors.surface },
  roundButtonDanger: { backgroundColor: Colors.danger },

  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    backgroundColor: Colors.textTertiary,
    justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: Colors.primary },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface },
  toggleThumbOn: { alignSelf: 'flex-end' },

  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  sheetBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },
  sheetOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tertiary,
    minHeight: 56,
    justifyContent: 'center',
  },
  sheetOptionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  sheetCancel: { paddingVertical: Spacing.md, alignItems: 'center' },
  sheetCancelText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
