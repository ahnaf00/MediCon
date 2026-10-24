/** A match from the server's fixed emergency rules (SymptomTriageService::screen). */
export interface RedFlag {
  code: string;
  message: string;
}

export const isRedFlag = (value: unknown): value is RedFlag =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as RedFlag).code === 'string' &&
  typeof (value as RedFlag).message === 'string';

/** /ai/chat returns the flag even when the AI fails (503), inside the error body. */
export const redFlagFromError = (err: unknown): RedFlag | null => {
  const flag = (err as { response?: { data?: { redFlag?: unknown } } } | null)?.response?.data
    ?.redFlag;
  return isRedFlag(flag) ? flag : null;
};
