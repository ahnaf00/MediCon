import { axiosClient } from '../axiosClient';
import { getAllPages, getPage, mapPage, MAX_PAGES, nextPageParam } from '../pagination';

jest.mock('../axiosClient', () => ({ axiosClient: { get: jest.fn() } }));
const get = axiosClient.get as jest.Mock;

const page = (items: number[], current: number, last: number) => ({
  data: items,
  meta: { current_page: current, last_page: last },
});

beforeEach(() => get.mockReset());

it('reads every page in order and keeps the envelope', async () => {
  get
    .mockResolvedValueOnce(page([1, 2], 1, 3))
    .mockResolvedValueOnce(page([3, 4], 2, 3))
    .mockResolvedValueOnce(page([5], 3, 3));

  await expect(getAllPages<number>('/things', { q: 'x' })).resolves.toEqual([1, 2, 3, 4, 5]);
  expect(get).toHaveBeenCalledTimes(3);
  expect(get).toHaveBeenLastCalledWith('/things', {
    params: { q: 'x', page: 3 },
    keepEnvelope: true,
  });
});

it('stops after one request for a single page', async () => {
  get.mockResolvedValueOnce(page([1], 1, 1));
  await expect(getAllPages('/things')).resolves.toEqual([1]);
  expect(get).toHaveBeenCalledTimes(1);
});

it('returns an unpaginated array as is', async () => {
  get.mockResolvedValueOnce([7, 8]);
  await expect(getAllPages('/things')).resolves.toEqual([7, 8]);
});

it('never asks for more than MAX_PAGES pages', async () => {
  get.mockImplementation(async (_url, cfg) => page([cfg.params.page], cfg.params.page, 99));
  const all = await getAllPages('/things');
  expect(all).toHaveLength(MAX_PAGES);
  expect(get).toHaveBeenCalledTimes(MAX_PAGES);
});

describe('getPage (H3)', () => {
  it('asks for one page and returns its position', async () => {
    get.mockResolvedValueOnce({ data: [3, 4], meta: { current_page: 2, last_page: 5, total: 9 } });

    await expect(getPage<number>('/things', { q: 'x' }, 2)).resolves.toEqual({
      items: [3, 4],
      page: 2,
      lastPage: 5,
      total: 9,
    });
    expect(get).toHaveBeenCalledWith('/things', {
      params: { q: 'x', page: 2 },
      keepEnvelope: true,
    });
  });

  it('treats an unpaginated array as the only page', async () => {
    get.mockResolvedValueOnce([7, 8]);
    await expect(getPage('/things')).resolves.toEqual({
      items: [7, 8],
      page: 1,
      lastPage: 1,
      total: 2,
    });
  });

  it('gives the next page number until the last page', () => {
    expect(nextPageParam({ items: [], page: 1, lastPage: 3, total: 50 })).toBe(2);
    expect(nextPageParam({ items: [], page: 3, lastPage: 3, total: 50 })).toBeUndefined();
  });

  it('maps items and keeps the position', () => {
    expect(mapPage({ items: [1, 2], page: 2, lastPage: 4, total: 70 }, (n) => n * 10)).toEqual({
      items: [10, 20],
      page: 2,
      lastPage: 4,
      total: 70,
    });
  });
});
