// src/services/ai/consultationChatService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Consultation AI chat — POST /api/v1/ai/consultation-chat, a real SSE stream.
// React Native's fetch does not expose a readable body stream, so this uses
// XMLHttpRequest and parses `responseText` incrementally on each progress event.
//
// Server events: `session` {sessionId} → `delta` {text}… → `done` {messageId}
// or `error` {message}. Non-200 responses (403/409/422) are plain JSON.
// ─────────────────────────────────────────────────────────────────────────────
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

export interface SseEvent {
  event: string;
  data: string;
}

export interface ConsultationChatHandlers {
  onSession?: (sessionId: number) => void;
  onDelta: (text: string) => void;
  onDone?: (messageId: number) => void;
  onError: (message: string) => void;
}

export interface ConsultationChatStream {
  /** Stop reading; no further handlers fire. */
  abort: () => void;
}

const GENERIC_ERROR = 'The AI assistant is unavailable right now. Please try again in a moment.';
const STREAM_TIMEOUT_MS = 90_000;

/**
 * Splits buffered SSE text into complete events, returning the unfinished tail.
 * Handles `\n` and `\r\n` line endings and multi-line `data:` fields.
 */
export const parseSseBuffer = (buffer: string): { events: SseEvent[]; rest: string } => {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events: SseEvent[] = [];

  for (const block of blocks) {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (data.length > 0) events.push({ event, data: data.join('\n') });
  }

  return { events, rest };
};

const parseJson = (text: string): Record<string, unknown> | null => {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

/**
 * Ask a question about one completed consultation and receive the answer as it
 * is generated. Exactly one of `onDone` / `onError` fires unless aborted.
 */
export const streamConsultationChat = (
  appointmentId: number | string,
  message: string,
  handlers: ConsultationChatHandlers,
): ConsultationChatStream => {
  const xhr = new XMLHttpRequest();
  let consumed = 0;
  let buffer = '';
  let finished = false;

  const fail = (msg: string) => {
    if (finished) return;
    finished = true;
    handlers.onError(msg);
  };

  const dispatch = (evt: SseEvent) => {
    if (finished) return;
    const data = parseJson(evt.data) ?? {};
    switch (evt.event) {
      case 'session':
        if (typeof data.sessionId === 'number') handlers.onSession?.(data.sessionId);
        break;
      case 'delta':
        if (typeof data.text === 'string') handlers.onDelta(data.text);
        break;
      case 'done':
        finished = true;
        handlers.onDone?.(typeof data.messageId === 'number' ? data.messageId : 0);
        break;
      case 'error':
        fail(typeof data.message === 'string' ? data.message : GENERIC_ERROR);
        break;
    }
  };

  const drain = () => {
    const text = xhr.responseText ?? '';
    buffer += text.slice(consumed);
    consumed = text.length;
    const { events, rest } = parseSseBuffer(buffer);
    buffer = rest;
    events.forEach(dispatch);
  };

  xhr.open('POST', `${Config.API.BASE_URL}/ai/consultation-chat`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  const token = useAuthStore.getState().token;
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  xhr.timeout = STREAM_TIMEOUT_MS;

  xhr.onprogress = () => {
    if (xhr.status === 200) drain();
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      drain();
      if (buffer.trim() !== '') {
        parseSseBuffer(`${buffer}\n\n`).events.forEach(dispatch);
        buffer = '';
      }
      fail('The response ended unexpectedly. Please try again.');
      return;
    }

    if (xhr.status === 401) {
      // Same as the axios client: the token was rejected, so sign out locally.
      useAuthStore.getState().logout({ remote: false });
    }
    const body = parseJson(xhr.responseText ?? '');
    fail(typeof body?.message === 'string' ? body.message : GENERIC_ERROR);
  };

  xhr.onerror = () => fail('Could not reach MediCon. Check your connection and try again.');
  xhr.ontimeout = () => fail('The AI assistant took too long to respond. Please try again.');

  xhr.send(JSON.stringify({ appointment_id: Number(appointmentId), message }));

  return {
    abort: () => {
      finished = true;
      xhr.abort();
    },
  };
};
