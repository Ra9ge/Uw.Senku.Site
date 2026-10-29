import { describe, expect, it, vi } from 'vitest';
import { buildQuery, Senku, SenkuError } from '../src/index.js';

const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ ok: true, data }), { status, headers: { 'content-type': 'application/json' } });
const fail = (status: number, code: string, message = code) => new Response(JSON.stringify({ ok: false, error: { code, message } }), { status });

function client(responses: Response[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw new Error('no more responses');
    return next;
  });
  return { senku: new Senku({ fetch: fetch as unknown as typeof globalThis.fetch, retries: 2, baseUrl: 'https://api.test/v2' }), calls };
}

describe('buildQuery', () => {
  it('skips empty values and joins arrays', () => {
    expect(buildQuery({ a: 1, b: '', c: undefined, d: [1, 2], e: false })).toBe('?a=1&d=1%2C2&e=false');
  });

  it('returns empty string for nothing', () => {
    expect(buildQuery({})).toBe('');
  });
});

describe('Senku', () => {
  it('unwraps the data envelope', async () => {
    const { senku, calls } = client([ok({ db: true, site: true, uptime: 5 })]);
    await expect(senku.health()).resolves.toEqual({ db: true, site: true, uptime: 5 });
    expect(calls[0].url).toBe('https://api.test/v2/health');
  });

  it('sends a token when given', async () => {
    const { senku, calls } = client([ok({ user: { id: 1 } })]);
    senku.setToken('abc');
    await senku.users.get(1);
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('looks users up by name', async () => {
    const { senku, calls } = client([ok({ user: { id: 7, username: 'kage' } })]);
    const user = await senku.users.get('kage');
    expect(user.id).toBe(7);
    expect(calls[0].url).toBe('https://api.test/v2/users/0?username=kage');
  });

  it('throws SenkuError with the API code', async () => {
    const { senku } = client([fail(404, 'not_found', 'User not found')]);
    const err = await senku.users.get(999).catch((e) => e);
    expect(err).toBeInstanceOf(SenkuError);
    expect(err.code).toBe('not_found');
    expect(err.isNotFound).toBe(true);
  });

  it('retries server errors and then succeeds', async () => {
    const { senku, calls } = client([fail(502, 'bad_gateway'), ok({ items: [], updated_at: 'x' })]);
    await expect(senku.schedule()).resolves.toEqual({ items: [], updated_at: 'x' });
    expect(calls).toHaveLength(2);
  });

  it('does not retry client errors', async () => {
    const { senku, calls } = client([fail(400, 'bad_request')]);
    await expect(senku.search('')).rejects.toBeInstanceOf(SenkuError);
    expect(calls).toHaveLength(1);
  });

  it('walks every review page', async () => {
    const { senku } = client([ok({ reviews: [{ id: 1 }, { id: 2 }], total: 3, has_more: true }), ok({ reviews: [{ id: 3 }], total: 3, has_more: false })]);
    const ids: number[] = [];
    for await (const r of senku.reviews.iterate(2)) ids.push(r.id);
    expect(ids).toEqual([1, 2, 3]);
  });

  it('caches identical requests when asked', async () => {
    const fetch = vi.fn(async () => ok({ db: true, site: true, uptime: 1 }));
    const senku = new Senku({ fetch: fetch as unknown as typeof globalThis.fetch, cacheTtlMs: 60_000 });
    await senku.health();
    await senku.health();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
