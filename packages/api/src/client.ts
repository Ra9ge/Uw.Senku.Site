import { Http } from './http.js';
import type {
  AnimeCard,
  AnimeDetails,
  AnimeList,
  AnimeListParams,
  AnimeLogos,
  AnimePosters,
  AnimeRating,
  AnimeTrailer,
  Collection,
  FavoriteItem,
  Friend,
  Health,
  PublicUser,
  Review,
  ReviewPage,
  Schedule,
  SearchResult,
  TopUser,
  UserCards,
  UserSearchHit,
  UserStats,
  Voice,
} from './types.js';

export const DEFAULT_BASE_URL = 'https://senku.one/api/v2';
export const VERSION = '0.1.0';

export interface SenkuOptions {
  baseUrl?: string;

  token?: string;

  userAgent?: string;

  fetch?: typeof fetch;

  timeoutMs?: number;

  retries?: number;

  cacheTtlMs?: number;
}

type UserRef = number | string;

const userPath = (ref: UserRef) => (typeof ref === 'number' || /^\d+$/.test(ref) ? `users/${ref}` : `users/0`);
const userQuery = (ref: UserRef) => (typeof ref === 'number' || /^\d+$/.test(ref) ? undefined : { username: ref });

export class Senku {
  private readonly http: Http;

  constructor(options: SenkuOptions = {}) {
    const f = options.fetch ?? globalThis.fetch;
    if (!f) throw new Error('No fetch available: use Node 18+ or pass `fetch` in options');
    this.http = new Http({
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, ''),
      token: options.token,
      userAgent: options.userAgent ?? `SenkuSDK/${VERSION} (+https://github.com/Ra9ge/Uw.Senku.Site)`,
      fetch: f.bind(globalThis),
      timeoutMs: options.timeoutMs ?? 15_000,
      retries: options.retries ?? 2,
      cacheTtlMs: options.cacheTtlMs ?? 0,
    });
  }

  setToken(token: string | undefined) {
    this.http.setToken(token);
  }

  readonly anime = {
    list: (params: AnimeListParams = {}) => this.http.get<AnimeList>('anime', { ...params }),

    get: (id: number) => this.http.get<AnimeDetails>(`anime/${id}`),

    rating: (id: number) => this.http.get<AnimeRating>(`anime/${id}/rating`),

    logos: (id: number) => this.http.get<AnimeLogos>(`anime/${id}/logos`),

    posters: (id: number) => this.http.get<AnimePosters>(`anime/${id}/posters`),

    trailer: (id: number) => this.http.get<AnimeTrailer>(`anime/${id}/trailer`),

    iterate: (params: Omit<AnimeListParams, 'page'> = {}, maxPages = 50): AsyncGenerator<AnimeCard> => this.walkAnime(params, maxPages),
  };

  search(q: string) {
    return this.http.get<SearchResult>('search', { q });
  }

  schedule() {
    return this.http.get<Schedule>('schedule');
  }

  readonly reviews = {
    all: (opts: { limit?: number; offset?: number } = {}) => this.http.get<ReviewPage>('reviews/all', { limit: opts.limit ?? 20, offset: opts.offset ?? 0 }),

    forAnime: (animeId: number) => this.http.get<{ reviews: Review[]; public_count: number }>('reviews', { anime_id: animeId }),

    get: (id: number) => this.http.get<{ review: Review }>(`reviews/${id}`).then((r) => r.review),

    iterate: (pageSize = 30): AsyncGenerator<Review> => this.walkReviews(pageSize),
  };

  readonly users = {
    get: (ref: UserRef) => this.http.get<{ user: PublicUser }>(userPath(ref), userQuery(ref)).then((r) => r.user),

    stats: (id: number) => this.http.get<UserStats>(`users/${id}/stats`),
    favorites: (id: number) => this.http.get<{ favorites: FavoriteItem[] }>(`users/${id}/favorites`).then((r) => r.favorites),
    friends: (id: number) => this.http.get<{ friends: Friend[] }>(`users/${id}/friends`).then((r) => r.friends),
    cards: (id: number) => this.http.get<UserCards>(`users/${id}/cards`),
    reviews: (id: number) => this.http.get<{ reviews: Review[] }>(`users/${id}/reviews`).then((r) => r.reviews),
    search: (q: string) => this.http.get<{ users: UserSearchHit[] }>('users/search', { q }).then((r) => r.users),

    top: (filter?: string) => this.http.get<{ users: TopUser[]; unit: string }>('top-users', { filter }),
  };

  readonly collections = {
    list: (opts: { q?: string; sort?: string; limit?: number; offset?: number } = {}) => this.http.get<{ collections: Collection[]; has_more: boolean }>('collections', opts),
    get: (id: number) => this.http.get<{ collection: Collection }>(`collections/${id}`),
  };

  voices() {
    return this.http.get<{ translations: Voice[] }>('voices').then((r) => r.translations);
  }

  health() {
    return this.http.get<Health>('health');
  }

  private async *walkAnime(params: Omit<AnimeListParams, 'page'>, maxPages: number): AsyncGenerator<AnimeCard> {
    for (let page = 1; page <= maxPages; page++) {
      const res = await this.http.get<AnimeList>('anime', { ...params, page });
      yield* res.results;
      if (!res.has_more || !res.results.length) return;
    }
  }

  private async *walkReviews(pageSize: number): AsyncGenerator<Review> {
    for (let offset = 0; ; offset += pageSize) {
      const page = await this.http.get<ReviewPage>('reviews/all', { limit: pageSize, offset });
      yield* page.reviews;
      if (!page.has_more || !page.reviews.length) return;
    }
  }
}
