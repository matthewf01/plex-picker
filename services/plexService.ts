
import { PlexMediaItem, PlexServerConfig, PlexLibrarySection, PlexPinResponse, PlexResource } from '../types';

// Mock Data for Demo Mode
const MOCK_MOVIES: PlexMediaItem[] = [
  { ratingKey: '1', key: '/library/metadata/1', title: 'Inception', type: 'movie', year: 2010, summary: 'A thief who steals corporate secrets through the use of dream-sharing technology.', genre: ['Sci-Fi', 'Action'], viewCount: 2, duration: 8880000 },
  { ratingKey: '2', key: '/library/metadata/2', title: 'The Grand Budapest Hotel', type: 'movie', year: 2014, summary: 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.', genre: ['Comedy', 'Drama'], viewCount: 0, duration: 5940000 },
  { ratingKey: '3', key: '/library/metadata/3', title: 'Paddington 2', type: 'movie', year: 2017, summary: 'Paddington, now happily settled with the Brown family and a popular member of the local community, picks up a series of odd jobs to buy the perfect present.', genre: ['Family', 'Comedy'], viewCount: 5, duration: 6180000 },
  { ratingKey: '4', key: '/library/metadata/4', title: 'Hereditary', type: 'movie', year: 2018, summary: 'A grieving family is haunted by tragic and disturbing occurrences.', genre: ['Horror', 'Drama'], viewCount: 0, duration: 7620000 },
  { ratingKey: '5', key: '/library/metadata/5', title: 'Mad Max: Fury Road', type: 'movie', year: 2015, summary: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler.', genre: ['Action', 'Sci-Fi'], viewCount: 3, duration: 7200000 },
  { ratingKey: '6', key: '/library/metadata/6', title: 'Before Sunrise', type: 'movie', year: 1995, summary: 'A young man and woman meet on a train in Europe, and wind up spending one evening together in Vienna.', genre: ['Romance', 'Drama'], viewCount: 1, duration: 6060000 },
];

const MOCK_SHOWS: PlexMediaItem[] = [
  { ratingKey: '10', key: '/library/metadata/10', title: 'Severance', type: 'show', year: 2022, summary: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.', genre: ['Sci-Fi', 'Thriller'], viewCount: 0, duration: 3420000 },
  { ratingKey: '11', key: '/library/metadata/11', title: 'Bluey', type: 'show', year: 2018, summary: 'The adventures of a Blue Heeler puppy, Bluey, who lives with her mum, dad, and sister.', genre: ['Family', 'Animation'], viewCount: 50, duration: 420000 },
  { ratingKey: '12', key: '/library/metadata/12', title: 'Succession', type: 'show', year: 2018, summary: 'The Roy family is known for controlling the biggest media and entertainment company in the world.', genre: ['Drama', 'Comedy'], viewCount: 0, duration: 3600000 },
];

export class PlexService {
  config: PlexServerConfig | null = null;
  isDemo: boolean = false;
  clientId: string;

  constructor(config?: PlexServerConfig) {
    // Generate or retrieve a persistent Client ID for this browser
    let storedId = localStorage.getItem('plex_client_id');
    if (!storedId) {
      storedId = 'plexpicker-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('plex_client_id', storedId);
    }
    this.clientId = storedId;

    if (config) {
      this.config = config;
    } else {
      this.isDemo = true;
    }
  }

  // --- Auth & Setup Methods ---

  getHeaders() {
    return {
      'Accept': 'application/json',
      'X-Plex-Product': 'PlexPicker',
      'X-Plex-Version': '1.0.0',
      'X-Plex-Client-Identifier': this.clientId,
      'X-Plex-Platform': 'Web',
      'X-Plex-Device': 'Browser',
      'X-Plex-Device-Name': 'PlexPicker',
    };
  }

  // Step 1: Get PIN from Plex.tv
  async getPin(): Promise<PlexPinResponse> {
    const res = await fetch('https://plex.tv/api/v2/pins?strong=true', {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to create PIN');
    const data = await res.json();
    return data;
  }

  // Step 2: Check status of PIN
  async checkPin(id: number): Promise<string | null> {
    const res = await fetch(`https://plex.tv/api/v2/pins/${id}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    const data = await res.json();
    // Returns authToken if linked, or null/undefined if not yet
    return data.authToken || null;
  }

  // Step 3: Get Resources (Servers)
  async getResources(token: string): Promise<PlexResource[]> {
    const res = await fetch(`https://plex.tv/api/v2/resources?includeHttps=1&includeRelay=1`, {
      headers: {
        ...this.getHeaders(),
        'X-Plex-Token': token
      }
    });
    if (!res.ok) throw new Error('Failed to fetch resources');
    const data = await res.json();
    
    return data
      .filter((r: PlexResource) => r.provides.includes('server'))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        ...r,
        // Map Ownership Flags
        owned: r.owned === '1' || r.owned === 1 || r.owned === true,
        sourceTitle: r.sourceTitle || null,
        connections: r.connections.map((c: any) => ({
          ...c,
          // API returns "0" or "1" strings often, ensuring boolean
          local: c.local === '1' || c.local === 1 || c.local === true,
          relay: c.relay === '1' || c.relay === 1 || c.relay === true
        }))
      }));
  }

  // Helper: Test a connection URL to see if it's accessible
  // We use this to pick the best connection from the list (Local IP vs Public IP vs Relay)
  async testConnection(uri: string, token: string): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const res = await fetch(`${uri}/identity?X-Plex-Token=${token}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      clearTimeout(timeoutId);
      return false;
    }
  }

  // --- Core App Methods ---

  // Helper to construct URL with Auth
  getUrl(path: string): string {
    const baseUrl = this.config?.url.replace(/\/$/, '');
    const connector = path.includes('?') ? '&' : '?';
    // We add Accept to query params as a backup, but Headers are primary
    return `${baseUrl}${path}${connector}X-Plex-Token=${this.config?.token}&Accept=application/json`;
  }

  async validateConnection(): Promise<string | true> {
    if (this.isDemo) return true;
    if (!this.config) throw new Error("No config");

    try {
      const res = await fetch(this.getUrl('/identity'), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized: Invalid Plex Token");
        throw new Error(`Server responded with ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      const machineIdentifier = data.MediaContainer?.machineIdentifier;
      
      return machineIdentifier || true;
    } catch (e: any) {
      console.error("Plex Connection Failed:", e);
      if (e.message === 'Failed to fetch') {
        throw new Error("Connection failed. This is likely a CORS or Mixed Content issue. Ensure you are using your server's Local IP (e.g. 192.168.x.x) and not 'localhost', or check if your browser is blocking HTTP requests from this HTTPS page.");
      }
      throw e;
    }
  }

  async getLibraries(): Promise<PlexLibrarySection[]> {
    if (this.isDemo) {
      return [
        { key: '1', type: 'movie', title: 'Movies' },
        { key: '2', type: 'show', title: 'TV Shows' }
      ];
    }

    try {
      const res = await fetch(this.getUrl('/library/sections'), {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      
      if (!data.MediaContainer || !data.MediaContainer.Directory) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.MediaContainer.Directory.map((lib: any) => ({
        key: lib.key,
        type: lib.type,
        title: lib.title
      })).filter((l: PlexLibrarySection) => l.type === 'movie' || l.type === 'show');
    } catch (e) {
      console.error("Error fetching libraries", e);
      throw e; // Propagate error so App can handle it
    }
  }

  async getAllItems(libraryKey: string): Promise<PlexMediaItem[]> {
    if (this.isDemo) {
      return libraryKey === '1' ? MOCK_MOVIES : MOCK_SHOWS;
    }

    try {
      const res = await fetch(this.getUrl(`/library/sections/${libraryKey}/all`), {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      
      if (!data.MediaContainer.Metadata) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.MediaContainer.Metadata.map((item: any) => ({
        ratingKey: item.ratingKey,
        key: item.key,
        title: item.title,
        type: item.type,
        year: item.year,
        summary: item.summary,
        viewCount: item.viewCount || 0,
        genre: item.Genre ? item.Genre.map((g: { tag: string }) => g.tag) : [],
        thumb: item.thumb ? this.getUrl(item.thumb) : undefined,
        art: item.art ? this.getUrl(item.art) : undefined,
        duration: item.duration // Map duration from API
      }));
    } catch (e) {
      console.error("Error fetching items", e);
      return [];
    }
  }
}
