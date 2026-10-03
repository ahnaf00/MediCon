import { parseSseBuffer, streamConsultationChat } from '../consultationChatService';

const mockLogout = jest.fn();
jest.mock('../../../store/authStore', () => ({
  useAuthStore: { getState: () => ({ token: 'test-token', logout: mockLogout }) },
}));

/** Minimal XMLHttpRequest stand-in the test drives by hand. */
class FakeXhr {
  static last: FakeXhr;
  status = 0;
  responseText = '';
  timeout = 0;
  headers: Record<string, string> = {};
  method = '';
  url = '';
  body: string | null = null;
  aborted = false;
  onprogress: (() => void) | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: string) {
    this.body = body;
  }
  abort() {
    this.aborted = true;
  }

  /** Append streamed text and fire a progress event. */
  push(text: string) {
    this.status = 200;
    this.responseText += text;
    this.onprogress?.();
  }
  finish(status = 200, body?: string) {
    this.status = status;
    if (body !== undefined) this.responseText = body;
    this.onload?.();
  }
}

const event = (name: string, data: object) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

const handlers = () => ({
  onSession: jest.fn(),
  onDelta: jest.fn(),
  onDone: jest.fn(),
  onError: jest.fn(),
});

beforeEach(() => {
  (globalThis as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXhr;
  mockLogout.mockClear();
});

describe('parseSseBuffer', () => {
  it('returns complete events and keeps the unfinished tail', () => {
    const { events, rest } = parseSseBuffer('event: delta\ndata: {"text":"Hi"}\n\nevent: del');
    expect(events).toEqual([{ event: 'delta', data: '{"text":"Hi"}' }]);
    expect(rest).toBe('event: del');
  });

  it('handles CRLF line endings and multi-line data', () => {
    const { events } = parseSseBuffer('event: x\r\ndata: a\r\ndata: b\r\n\r\n');
    expect(events).toEqual([{ event: 'x', data: 'a\nb' }]);
  });
});

describe('streamConsultationChat', () => {
  it('posts the question with the auth header', () => {
    streamConsultationChat(7, 'What was discussed?', handlers());
    const xhr = FakeXhr.last;

    expect(xhr.method).toBe('POST');
    expect(xhr.url).toMatch(/\/ai\/consultation-chat$/);
    expect(xhr.headers.Authorization).toBe('Bearer test-token');
    expect(JSON.parse(xhr.body!)).toEqual({ appointment_id: 7, message: 'What was discussed?' });
  });

  it('delivers deltas as they arrive, even split across chunks', () => {
    const h = handlers();
    streamConsultationChat(1, 'q', h);
    const xhr = FakeXhr.last;

    xhr.push(event('session', { sessionId: 3 }) + 'event: delta\ndata: {"te');
    expect(h.onSession).toHaveBeenCalledWith(3);
    expect(h.onDelta).not.toHaveBeenCalled();

    xhr.push('xt":"Hello "}\n\n');
    expect(h.onDelta).toHaveBeenLastCalledWith('Hello ');

    xhr.push(event('delta', { text: 'there.' }) + event('done', { messageId: 9 }));
    xhr.finish();

    expect(h.onDelta).toHaveBeenCalledTimes(2);
    expect(h.onDone).toHaveBeenCalledWith(9);
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('reports a server error event once', () => {
    const h = handlers();
    streamConsultationChat(1, 'q', h);
    FakeXhr.last.push(
      event('session', { sessionId: 3 }) + event('error', { message: 'Unavailable' }),
    );
    FakeXhr.last.finish();

    expect(h.onError).toHaveBeenCalledTimes(1);
    expect(h.onError).toHaveBeenCalledWith('Unavailable');
  });

  it('treats a stream that ends without done as an error', () => {
    const h = handlers();
    streamConsultationChat(1, 'q', h);
    FakeXhr.last.push(event('delta', { text: 'Partial' }));
    FakeXhr.last.finish();

    expect(h.onError).toHaveBeenCalledWith(expect.stringMatching(/ended unexpectedly/));
  });

  it('surfaces the JSON message of a non-200 response', () => {
    const h = handlers();
    streamConsultationChat(1, 'q', h);
    FakeXhr.last.finish(409, JSON.stringify({ message: 'No summary yet.' }));

    expect(h.onError).toHaveBeenCalledWith('No summary yet.');
    expect(h.onDelta).not.toHaveBeenCalled();
  });

  it('signs out on 401', () => {
    streamConsultationChat(1, 'q', handlers());
    FakeXhr.last.finish(401, '{"message":"Unauthenticated."}');

    expect(mockLogout).toHaveBeenCalledWith({ remote: false });
  });

  it('stops calling handlers after abort', () => {
    const h = handlers();
    const stream = streamConsultationChat(1, 'q', h);
    stream.abort();
    FakeXhr.last.push(event('delta', { text: 'late' }));
    FakeXhr.last.finish();

    expect(FakeXhr.last.aborted).toBe(true);
    expect(h.onDelta).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
  });
});
