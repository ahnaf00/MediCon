import { AxiosError, AxiosHeaders } from 'axios';
import { isRedFlag, redFlagFromError } from '../redFlag';

const flag = { code: 'heart_attack', message: 'A heart attack is an emergency.' };

it('reads the flag from a 503 body', () => {
  const err = new AxiosError(
    'Request failed with status code 503',
    'ERR_BAD_RESPONSE',
    undefined,
    {},
    {
      status: 503,
      statusText: '',
      data: { message: 'unavailable', redFlag: flag },
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
  expect(redFlagFromError(err)).toEqual(flag);
});

it('is null offline or without a flag', () => {
  expect(redFlagFromError(new AxiosError('Network Error', 'ERR_NETWORK'))).toBeNull();
  expect(redFlagFromError(null)).toBeNull();
});

it('rejects malformed flags', () => {
  expect(isRedFlag({ code: 'x' })).toBe(false);
  expect(isRedFlag(null)).toBe(false);
  expect(isRedFlag(flag)).toBe(true);
});
