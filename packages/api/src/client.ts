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
  /** API root, default `https://senku.one/api/v2`. */
  baseUrl?: string;
  /** Bearer token from `POST /auth/login`, for endpoints that know who you are. */
  token?: string;
  /** Sent as User-Agent from Node. Please keep a way to contact you in it. */
  userAgent?: string;
  /** Custom fetch, e.g. for tests or proxies. */
  fetch?: typeof fetch;
  /** Per-request timeout, default 15 000 ms. */
  timeoutMs?: number;
  /** Retries on network errors, 429 and 5xx, default 2. */
  retries?: number;
  /** In-memory cache for identical GET requests, default off. */
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

  /** Use a different token, for example after the user logs in. */
  setToken(token: string | undefined) {
    this.http.setToken(token);
  }

  readonly anime = {
    /** Catalog page. */
    list: (params: AnimeListParams = {}) => this.http.get<AnimeList>('anime', { ...params }),
    /** Full card of one title by Shikimori id. */
    get: (id: number) => this.http.get<AnimeDetails>(`anime/${id}`),
    /** Senku users' rating with a 1–5 histogram. */
    rating: (id: number) => this.http.get<AnimeRating>(`anime/${id}/rating`),
    /** Transparent title logos (ja / en) when available. */
    logos: (id: number) => this.http.get<AnimeLogos>(`anime/${id}/logos`),
    /** Extra posters from MAL, AniList and Kitsu. */
    posters: (id: number) => this.http.get<AnimePosters>(`anime/${id}/posters`),
    /** Trailer files by quality. */
    trailer: (id: number) => this.http.get<AnimeTrailer>(`anime/${id}/trailer`),
    /** Walks catalog pages until the end or `maxPages`. */
    iterate: (params: Omit<AnimeListParams, 'page'> = {}, maxPages = 50): AsyncGenerator<AnimeCard> => this.walkAnime(params, maxPages),
  };

  /** Title search by any name. */
  search(q: string) {
    return this.http.get<SearchResult>('search', { q });
  }

  /** New episodes timeline. */
  schedule() {
    return this.http.get<Schedule>('schedule');
  }

  readonly reviews = {
    /** Newest approved reviews, 30 per page at most. */
    all: (opts: { limit?: number; offset?: number } = {}) => this.http.get<ReviewPage>('reviews/all', { limit: opts.limit ?? 20, offset: opts.offset ?? 0 }),
    /** Reviews of one title. */
    forAnime: (animeId: number) => this.http.get<{ reviews: Review[]; public_count: number }>('reviews', { anime_id: animeId }),
    /** One review. */
    get: (id: number) => this.http.get<{ review: Review }>(`reviews/${id}`).then((r) => r.review),
    /** Every approved review, page by page. */
    iterate: (pageSize = 30): AsyncGenerator<Review> => this.walkReviews(pageSize),
  };

  readonly users = {
    /** Public profile by id or username. */
    get: (ref: UserRef) => this.http.get<{ user: PublicUser }>(userPath(ref), userQuery(ref)).then((r) => r.user),
    /** Watch time, streak, favourite genres and more. */
    stats: (id: number) => this.http.get<UserStats>(`users/${id}/stats`),
    favorites: (id: number) => this.http.get<{ favorites: FavoriteItem[] }>(`users/${id}/favorites`).then((r) => r.favorites),
    friends: (id: number) => this.http.get<{ friends: Friend[] }>(`users/${id}/friends`).then((r) => r.friends),
    cards: (id: number) => this.http.get<UserCards>(`users/${id}/cards`),
    reviews: (id: number) => this.http.get<{ reviews: Review[] }>(`users/${id}/reviews`).then((r) => r.reviews),
    search: (q: string) => this.http.get<{ users: UserSearchHit[] }>('users/search', { q }).then((r) => r.users),
    /** Leaderboard. */
    top: (filter?: string) => this.http.get<{ users: TopUser[]; unit: string }>('top-users', { filter }),
  };

  readonly collections = {
    list: (opts: { q?: string; sort?: string; limit?: number; offset?: number } = {}) => this.http.get<{ collections: Collection[]; has_more: boolean }>('collections', opts),
    get: (id: number) => this.http.get<{ collection: Collection }>(`collections/${id}`),
  };

  /** All dub and subtitle teams with title counts. */
  voices() {
    return this.http.get<{ translations: Voice[] }>('voices').then((r) => r.translations);
  }

  /** API status. */
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
