import { axiosClient } from './axiosClient';

/** Laravel's paginated resource collection: the items plus where we are in the list. */
interface PageEnvelope<T> {
  data: T[];
  meta?: { current_page?: number; last_page?: number };
}

/**
 * Enough for every list this app shows (e.g. 10 × 50 chat messages) while staying
 * well under the API's 60-requests-per-minute limit.
 */
export const MAX_PAGES = 10;

/**
 * Reads every page of a paginated endpoint and returns the items in order
 * (audit API-003: before this only the first page was ever shown).
 */
export async function getAllPages<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = (await axiosClient.get(url, {
      params: { ...params, page },
      keepEnvelope: true,
    })) as unknown as PageEnvelope<T> | T[];

    // An endpoint that isn't paginated returns the whole list at once.
    if (Array.isArray(body)) return body;

    items.push(...(body?.data ?? []));
    if (page >= (body?.meta?.last_page ?? 1)) break;
  }

  return items;
}
