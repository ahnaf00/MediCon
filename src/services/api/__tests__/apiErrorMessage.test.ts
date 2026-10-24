import { AxiosError, AxiosHeaders } from 'axios';
import { apiErrorMessage, apiErrorStatus } from '../../../utils/errors';

// Real AxiosError objects, built the way axios builds them (audit API-006).
const httpError = (status: number, data: unknown) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    undefined,
    {},
    {
      status,
      statusText: '',
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );

describe('apiErrorMessage', () => {
  it("shows the server's message from an HTTP error", () => {
    expect(apiErrorMessage(httpError(400, { message: 'Invalid OTP.' }), 'fallback')).toBe(
      'Invalid OTP.',
    );
  });

  it('shows the message of an unwrapped 422 body', () => {
    const body = { message: 'The phone field is required.', errors: {}, status: 422 };
    expect(apiErrorMessage(body, 'fallback')).toBe('The phone field is required.');
  });

  it('uses the fallback for a network error instead of "Network Error"', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK', undefined, {});
    expect(apiErrorMessage(err, 'Check your connection')).toBe('Check your connection');
  });

  it('uses the fallback for a timeout', () => {
    const err = new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED');
    expect(apiErrorMessage(err, 'Check your connection')).toBe('Check your connection');
  });

  it('uses the fallback for a server error, even one with a message', () => {
    expect(apiErrorMessage(httpError(500, { message: 'Server Error' }), 'fallback')).toBe(
      'fallback',
    );
  });

  it('uses the fallback when the server sends no message', () => {
    expect(apiErrorMessage(httpError(403, {}), 'fallback')).toBe('fallback');
  });

  it("shows an app Error's own message", () => {
    expect(apiErrorMessage(new Error('Doctor not found'), 'fallback')).toBe('Doctor not found');
  });

  it('never shows [object Object]', () => {
    expect(apiErrorMessage({ errors: { phone: ['x'] } }, 'fallback')).toBe('fallback');
  });
});

describe('apiErrorStatus', () => {
  it('reads the status of an HTTP error and of a 422 body', () => {
    expect(apiErrorStatus(httpError(429, {}))).toBe(429);
    expect(apiErrorStatus({ message: 'x', status: 422 })).toBe(422);
  });

  it('is undefined when the server was never reached', () => {
    expect(apiErrorStatus(new AxiosError('Network Error', 'ERR_NETWORK'))).toBeUndefined();
  });
});
