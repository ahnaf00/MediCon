export interface AppError {
  code: string;
  message: string;
}

export function createAppError(code: string, message: string): AppError {
  return {
    code,
    message,
  };
}

type ErrorLike = {
  isAxiosError?: boolean;
  status?: unknown;
  message?: unknown;
  response?: { status?: number; data?: { message?: unknown } };
} | null;

/**
 * The HTTP status of a failed API call, or undefined when the server was never
 * reached (offline, timeout). 422 bodies carry it as `status` (see axiosClient).
 */
export const apiErrorStatus = (err: unknown): number | undefined => {
  const e = err as ErrorLike;
  const status = e?.response?.status ?? e?.status;
  return typeof status === 'number' ? status : undefined;
};

/**
 * Text to show for a failed call: the server's own message when it sent one,
 * otherwise `fallback` — never raw axios text like "Network Error" or
 * "Request failed with status code 500" (audit API-006).
 */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as ErrorLike;
  let message: unknown;

  if (e?.isAxiosError) {
    // No response: the server was never reached. 5xx: its text is not for patients.
    const status = e.response?.status;
    message = status !== undefined && status < 500 ? e.response?.data?.message : undefined;
  } else {
    // A 422 body from axiosClient, or an Error thrown in the app.
    message = e?.message;
  }

  return typeof message === 'string' && message.trim() !== '' ? message : fallback;
};
