import { axiosClient } from './axiosClient';

/** Laravel's paginated resource collection: the items plus where we are in the list. */
interface PageEnvelope<T> {
  data: T[];
  meta?: { current_page?: number; last_page?: number; total?: number };
}

/** One page of a list, for screens that load more as you scroll (task H3). */
export interface Page<T> {
  items: T[];
  page: number;
  lastPage: number;
  total: number;
}

/** Reads one page of a paginated endpoint. */
export async function getPage<T>(
  url: string,
  params?: Record<string, unknown>,
  page = 1,
): Promise<Page<T>> {
  const body = (await axiosClient.get(url, {
    params: { ...params, page },
    keepEnvelope: true,
  })) as unknown as PageEnvelope<T> | T[];

  // An endpoint that isn't paginated returns the whole list at once.
  if (Array.isArray(body)) return { items: body, page: 1, lastPage: 1, total: body.length };

  const items = body?.data ?? [];
  return {
    items,
    page: body?.meta?.current_page ?? page,
    lastPage: body?.meta?.last_page ?? page,
    total: body?.meta?.total ?? items.length,
  };
}

/** `getNextPageParam` for useInfiniteQuery: the next page number, or undefined at the end. */
export function nextPageParam<T>(last: Page<T>): number | undefined {
  return last.page < last.lastPage ? last.page + 1 : undefined;
}

/** Maps the items of a page and keeps its position. */
export function mapPage<T, U>(page: Page<T>, fn: (item: T) => U): Page<U> {
  return { ...page, items: page.items.map(fn) };
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
