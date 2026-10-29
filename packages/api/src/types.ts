export type AnimeKind = 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'tv_special' | 'music' | 'pv' | 'cm' | (string & {});
export type AnimeStatus = 'anons' | 'ongoing' | 'released' | (string & {});

export interface Envelope<T> {
  ok: true;
  data: T;
}

export interface ErrorEnvelope {
  ok: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export interface AnimeCard {
  id: number;
  title: string;
  poster: string;
  score: string;
  episodes: string;
  episodes_aired: number;
  aired_on: string;
  url: string;
  kind: AnimeKind;
  status: AnimeStatus;
  description?: string;
  genres?: string[];
  genre_ids?: number[];
  studios?: string[];
}

export interface AnimeList {
  results: AnimeCard[];
  has_more: boolean;
  source: string;
}

export interface AnimeListParams {
  page?: number;
  limit?: number;
  order?: 'popularity' | 'ranked' | 'aired_on' | 'name' | (string & {});
  genre?: string | number | Array<string | number>;
  status?: AnimeStatus;
  kind?: AnimeKind;
  search?: string;
}

export interface AnimeDetails {
  id: string;
  title: string;
  title_en: string;
  title_orig: string;
  synonyms: string[];
  poster: string;
  score: string;
  status: AnimeStatus;
  episodes: number;
  episodes_total: number;
  episodes_aired: number;
  duration: number;
  description: string;
  genres: string[];
  year: string;
  kind: AnimeKind;
  screenshots: string[];
  next_episode: string | null;
}

export interface AnimeRating {
  avg_score: number;
  total_votes: number;
  histogram: Record<'1' | '2' | '3' | '4' | '5', number>;
  weighted_avg: number;
  raw_avg: number;
  user_rating: number | null;
}

export interface AnimeLogos {
  logos: { ja?: string; en?: string };
  tone: { ja?: string; en?: string };
}

export interface AnimePosters {
  id: number;
  posters: { url: string; source: string }[];
}

export type AnimeTrailer = Partial<Record<'480' | '720' | '1080', string>> & { source?: string };

export interface SearchResult {
  results: AnimeCard[];
  count: number;
  has_more: boolean;
}

export interface ScheduleItem {
  id: number;
  title: string;
  poster: string;
  kind: AnimeKind;
  episode: number;
  episodes: number;
  at: string;
}

export interface Schedule {
  updated_at: string;
  items: ScheduleItem[];
}

export interface PublicUser {
  id: number;
  username: string;
  avatar: string | null;
  profile_url: string | null;
  banner: string | null;
  background: string | null;
  frame: string | null;
  description: string | null;
  nickname_effect: string | null;
  level: number;
  total_exp: number;
  senku_plus: number;
  created_at: string;
  last_activity: string | null;
}

export interface UserStats {
  created_at: string;
  level: number;
  exp: { current: number; total: number; next_level: number; percentage: number };
  genres: { genre_name: string; watch_count: string }[];
  stats: {
    watch_hours: number;
    total_watch_seconds: number;
    episodes: number;
    anime_watched: number;
    manga_chapters: number;
    comments: number;
    friends: number;
    streak_days: number;
    [key: string]: number;
  };
}

export interface TopUser {
  id: number;
  username: string;
  avatar: string | null;
  profile_url: string | null;
  level: number;
  total_exp: number;
  total_watch_seconds: number;
  total_episodes_watched: number;
  total_manga_chapters_read: number;
  days_on_site: number;
  senku_plus: number;
  nickname_effect: string | null;
  frame: string | null;
}

export interface UserSearchHit {
  id: number;
  username: string;
  profile_url: string | null;
  avatar: string | null;
  frame: string | null;
  nickname_effect: string | null;
  level: number;
  url: string;
}

export interface FavoriteItem {
  id: number;
  title: string;
  poster: string;
  year: number | null;
  score: string;
  status: string;
  type: 'anime' | 'manga' | (string & {});
  watched_episodes: number;
  total_episodes: number;
}

export interface Friend {
  id: number;
  username: string;
  avatar: string | null;
  frame: string | null;
  last_activity: string | null;
  friend_count: number;
}

export interface CollectibleCard {
  id: number;
  anime_id: number;
  anime_title: string;
  character_name: string;
  image_url: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | (string & {});
  rarity_score: number;
  acquired_at: string;
}

export interface UserCards {
  cards: CollectibleCard[];
  total: number;
  hidden_all: boolean;
  showcase: number[];
}

export interface Review {
  id: number;
  user_id: number;
  anime_id: number;
  item_type: 'anime' | 'manga' | 'ranobe';
  content: string;
  rating: string;
  rating_story?: string;
  rating_music?: string;
  rating_art?: string;
  rating_chars?: string;
  is_spoiler?: number;
  created_at?: string;
  username?: string;
  avatar?: string | null;
  target_title?: string;
  target_poster?: string;
  like_count?: number;
}

export interface ReviewPage {
  reviews: Review[];
  total: number;
  has_more: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  cover: string | null;
  items_count: number;
  subscribers_count: number;
  views_count: number;
  created_at: string;
  owner: { id: number; username: string; avatar?: string | null };
}

export interface Voice {
  id: string;
  title: string;
  count: number;
}

export interface Health {
  db: boolean;
  site: boolean;
  uptime: number;
}
