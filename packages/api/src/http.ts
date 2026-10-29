import { SenkuError } from './errors.js';
import type { Envelope, ErrorEnvelope } from './types.js';

export type Query = Record<string, string | number | boolean | undefined | null | Array<string | number>>;

export interface HttpOptions {
  baseUrl: string;
  token?: string;
  userAgent: string;
  fetch: typeof fetch;
  timeoutMs: number;
  retries: number;
  cacheTtlMs: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function buildQuery(query: Query = {}): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    qs.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export class Http {
  private readonly cache = new Map<string, { at: number; value: unknown }>();

  constructor(private readonly opts: HttpOptions) {}

  setToken(token: string | undefined) {
    this.opts.token = token;
    this.cache.clear();
  }

  async get<T>(path: string, query?: Query): Promise<T> {
    const url = `${this.opts.baseUrl}/${path.replace(/^\//, '')}${buildQuery(query)}`;
    const ttl = this.opts.cacheTtlMs;
    if (ttl > 0) {
      const hit = this.cache.get(url);
      if (hit && Date.now() - hit.at < ttl) return hit.value as T;
    }
    const value = await this.request<T>(url);
    if (ttl > 0) this.cache.set(url, { at: Date.now(), value });
    return value;
  }

  private async request<T>(url: string): Promise<T> {
    let attempt = 0;
    for (;;) {
      try {
        return await this.once<T>(url);
      } catch (e) {
        const err = e instanceof SenkuError ? e : new SenkuError(0, 'network', e instanceof Error ? e.message : String(e));
        if (!err.isRetryable || attempt >= this.opts.retries) throw err;
        const retryAfter = Number(err.details?.retryAfter);
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 400 * 2 ** attempt);
        attempt += 1;
      }
    }
  }

  private async once<T>(url: string): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.opts.timeoutMs);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (typeof window === 'undefined') headers['User-Agent'] = this.opts.userAgent;
    if (this.opts.token) headers.Authorization = `Bearer ${this.opts.token}`;
    try {
      const res = await this.opts.fetch(url, { headers, signal: ctrl.signal });
      const body = (await res.json().catch(() => null)) as Envelope<T> | ErrorEnvelope | null;
      if (!body) throw new SenkuError(res.status, 'bad_response', `Senku answered ${res.status} without JSON`, { retryAfter: res.headers.get('retry-after') });
      if (!body.ok) throw new SenkuError(res.status, body.error.code, body.error.message, { ...body.error.details, retryAfter: res.headers.get('retry-after') });
      return body.data;
    } catch (e) {
      if (e instanceof SenkuError) throw e;
      if (ctrl.signal.aborted) throw new SenkuError(0, 'timeout', `Request timed out after ${this.opts.timeoutMs} ms`);
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
}
