import { apiErrorMessage } from '../consultationsService';

jest.mock('../axiosClient', () => ({ axiosClient: {} }));

describe('apiErrorMessage', () => {
  it("shows the server's message from an HTTP error", () => {
    const err = {
      message: 'Request failed with status code 400',
      response: { data: { message: 'Invalid OTP.' } },
    };
    expect(apiErrorMessage(err, 'fallback')).toBe('Invalid OTP.');
  });

  it('shows the message of an unwrapped 422 body', () => {
    expect(
      apiErrorMessage({ message: 'The phone field is required.', errors: {} }, 'fallback'),
    ).toBe('The phone field is required.');
  });

  it('uses the fallback for a network error instead of the raw axios text', () => {
    const err = { message: 'Network Error', response: undefined };
    expect(apiErrorMessage(err, 'Check your connection')).toBe('Check your connection');
  });

  it('uses the fallback when the server sends no message', () => {
    const err = { message: 'Request failed with status code 500', response: { data: {} } };
    expect(apiErrorMessage(err, 'fallback')).toBe('fallback');
  });
});
