
export interface PlexServerConfig {
  url: string;
  token: string;
  machineIdentifier?: string;
  masterToken?: string;
  serverName?: string;
}

export interface PlexLibrarySection {
  key: string;
  type: 'movie' | 'show';
  title: string;
}

export interface PlexMediaItem {
  ratingKey: string;
  key: string;
  title: string;
  type: 'movie' | 'show';
  thumb?: string;
  art?: string;
  grandparentTitle?: string; // For episodes
  summary?: string;
  year?: number;
  viewCount?: number;
  lastViewedAt?: number;
  genre?: string[];
  duration?: number;
}

export enum AppState {
  SETUP = 'SETUP',
  DECODER = 'DECODER',
  LOADING = 'LOADING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export type OverlayState = 'ABOUT' | 'PRIVACY' | 'SUPPORT' | null;

export interface DecoderSelection {
  type: 'movie' | 'show' | 'any';
  history: 'unwatched' | 'favorite' | 'any';
  vibe: string;
}

export interface Recommendation {
  item: PlexMediaItem;
  reason: string;
  score: number;
  imdbRating?: string;
  rottenTomatoesScore?: string;
}

// Auth Types
export interface PlexPinResponse {
  id: number;
  code: string;
  clientIdentifier: string;
}

export interface PlexConnection {
  protocol: string;
  address: string;
  port: number;
  uri: string;
  local: boolean;
  relay: boolean;
  IPv6: boolean;
}

export interface PlexResource {
  name: string;
  product: string;
  productVersion: string;
  platform: string;
  clientIdentifier: string;
  createdAt: string;
  lastSeenAt: string;
  provides: string; // "server" etc
  ownerId: string | null;
  sourceTitle: string | null;
  owned: boolean;
  publicAddress: string;
  accessToken: string;
  connections: PlexConnection[];
}
