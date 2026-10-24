import { axiosClient } from '../axiosClient';
import { getAllPages, MAX_PAGES } from '../pagination';

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
