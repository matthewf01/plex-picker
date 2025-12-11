
import React, { useState, useEffect, useRef } from 'react';
import { PlexServerConfig, PlexResource, PlexConnection } from '../types';
import { PlexService } from '../services/plexService';

interface SetupProps {
  onConnect: (config: PlexServerConfig) => void;
  onDemo: () => void;
  loading: boolean;
  error?: string | null;
  initialToken?: string;
}

type SetupState = 'INIT' | 'POLLING' | 'SELECT_SERVER' | 'CONNECTING_SERVER' | 'MANUAL';

export const Setup: React.FC<SetupProps> = ({ onConnect, onDemo, loading, error, initialToken }) => {
  const [viewState, setViewState] = useState<SetupState>('INIT');
  const [authUrl, setAuthUrl] = useState('');
  const [servers, setServers] = useState<PlexResource[]>([]);
  const [authToken, setAuthToken] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  
  // Manual Fallback State
  const [manualUrl, setManualUrl] = useState('');
  const [manualToken, setManualToken] = useState('');

  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const plexService = useRef(new PlexService());

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  // Handle Initial Token (Switch Server flow)
  useEffect(() => {
    if (initialToken) {
        setAuthToken(initialToken);
        fetchServers(initialToken);
    }
  }, [initialToken]);

  const startPlexAuth = async () => {
    try {
      setViewState('POLLING');
      const pin = await plexService.current.getPin();
      
      // Construct Auth URL manually to ensure strict encoding and structure
      const clientId = encodeURIComponent(plexService.current.clientId);
      const code = encodeURIComponent(pin.code);
      const product = encodeURIComponent('PlexPicker'); 
      const platform = encodeURIComponent('Web');
      const device = encodeURIComponent('Browser');
      const deviceName = encodeURIComponent('PlexPicker'); 

      const authAppUrl = `https://app.plex.tv/auth#?clientID=${clientId}&code=${code}&context%5Bdevice%5D%5Bproduct%5D=${product}&context%5Bdevice%5D%5Bplatform%5D=${platform}&context%5Bdevice%5D%5Bdevice%5D=${device}&context%5Bdevice%5D%5BdeviceName%5D=${deviceName}`;
      
      setAuthUrl(authAppUrl);
      
      // Open Popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        authAppUrl, 
        'Plex Auth', 
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );

      // Start Polling
      pollInterval.current = setInterval(async () => {
        const token = await plexService.current.checkPin(pin.id);
        if (token) {
          if (pollInterval.current) clearInterval(pollInterval.current);
          setAuthToken(token);
          fetchServers(token);
        }
      }, 2000);

    } catch (e) {
      console.error(e);
      setViewState('INIT');
    }
  };

  const fetchServers = async (token: string) => {
    setConnectionStatus('Searching for servers...');
    try {
      const resources = await plexService.current.getResources(token);
      setServers(resources);
      setViewState('SELECT_SERVER');
    } catch (e) {
      setConnectionStatus('Failed to find servers.');
    }
  };

  const handleServerSelect = async (server: PlexResource) => {
    setViewState('CONNECTING_SERVER');
    setConnectionStatus(`Analyzing routes for ${server.name}...`);

    // Use specific Resource Token if available (Critical for shared servers)
    const resourceToken = server.accessToken || authToken;
    
    // 1. Filter Connections based on Ownership
    let candidates = server.connections || [];
    candidates = candidates.filter(c => c.uri); // Safety filter

    // CRITICAL: If this is a Shared Server (friend's server), DO NOT try Local IPs.
    // They will almost certainly time out and cause the browser to hang.
    if (!server.owned) {
       console.log("Shared server detected: Filtering out local connections.");
       candidates = candidates.filter(c => !c.local);
    }

    // 2. Sort connections: Remote Secure > Relay Secure > Local Secure > Insecure
    const sortConnections = (conns: PlexConnection[]) => {
      return conns.sort((a, b) => {
        // Prefer Secure
        const aSecure = a.protocol === 'https';
        const bSecure = b.protocol === 'https';
        if (aSecure !== bSecure) return aSecure ? -1 : 1;
        
        // Prefer Standard Remote (not Relay, not Local)
        const aStandard = !a.local && !a.relay;
        const bStandard = !b.local && !b.relay;
        if (aStandard !== bStandard) return aStandard ? -1 : 1;
        
        // Prefer Relay over Local (Relay is generally more reliable for web apps due to CORS/NAT)
        if (a.relay !== b.relay) return a.relay ? -1 : 1;
        
        return 0;
      });
    };

    const sorted = sortConnections(candidates);
    
    // Check if we are currently running on HTTPS
    const isAppSecure = window.location.protocol === 'https:';
    
    const secureCandidates = sorted.filter(c => c.protocol === 'https');
    const insecureCandidates = sorted.filter(c => c.protocol === 'http');

    const testRoute = async (conn: PlexConnection): Promise<PlexServerConfig> => {
      // Use resourceToken instead of master authToken
      const success = await plexService.current.testConnection(conn.uri, resourceToken);
      if (success) {
        return { url: conn.uri, token: resourceToken };
      }
      throw new Error('Unreachable');
    };

    // Helper for Promise.any behavior
    const anyPromise = (promises: Promise<PlexServerConfig>[]): Promise<PlexServerConfig> => {
      return new Promise((resolve, reject) => {
        let errors: any[] = [];
        let rejectedCount = 0;
        if (promises.length === 0) return reject(new Error("No promises"));

        promises.forEach(p => {
          p.then(resolve).catch(e => {
            errors.push(e);
            rejectedCount++;
            if (rejectedCount === promises.length) {
              reject(new Error("All connections failed"));
            }
          });
        });
      });
    };

    try {
        // Attempt 1: Secure Connections (Parallel Race)
        if (secureCandidates.length > 0) {
            setConnectionStatus(`Testing ${secureCandidates.length} secure endpoints...`);
            try {
                const best = await anyPromise(secureCandidates.map(c => testRoute(c)));
                onConnect(best);
                return;
            } catch (e) {
                console.warn("Secure connections failed", e);
            }
        }

        // Attempt 2: Insecure Connections (Parallel Race) - Fallback
        // Only attempt if not blocked by browser (or if user ignores warning)
        if (insecureCandidates.length > 0) {
            if (isAppSecure) {
                console.warn("Skipping insecure candidates due to Mixed Content restrictions on HTTPS host.");
            } else {
                setConnectionStatus(`Testing ${insecureCandidates.length} local/insecure endpoints...`);
                try {
                    const best = await anyPromise(insecureCandidates.map(c => testRoute(c)));
                    onConnect(best);
                    return;
                } catch (e) {
                     console.warn("Insecure connections failed", e);
                }
            }
        }
        
        throw new Error("All connection attempts failed");

    } catch (e) {
      console.error("Connection race failed", e);
      setConnectionStatus(`Could not reach ${server.name}. Check if Remote Access is enabled in your Server Settings.`);
      setTimeout(() => setViewState('SELECT_SERVER'), 4000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect({ url: manualUrl.replace(/\/$/, ''), token: manualToken });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-md mx-auto px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white/90 mb-2 tracking-tighter">
          PLEX<span className="text-plex-orange">PICKER</span>
        </h1>
        <p className="text-gray-400 font-light text-lg tracking-wide uppercase">When you can't decide what to watch</p>
      </div>

      <div className="w-full bg-plex-slate/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-center">
        
        {/* Error Banner */}
        {error && (
          <div className="absolute top-0 left-0 right-0 p-3 bg-red-900/80 text-center text-xs text-red-200">
             {error}
          </div>
        )}

        {/* View: INIT (Start) */}
        {viewState === 'INIT' && (
          <div className="space-y-6">
            <button 
              onClick={startPlexAuth}
              className="w-full bg-plex-orange hover:bg-yellow-500 text-black font-bold py-4 rounded-lg uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
              Sign In with Plex
            </button>
            
            <div className="text-center pt-4">
              <button onClick={() => setViewState('MANUAL')} className="text-xs text-gray-500 hover:text-white underline decoration-dotted">
                Advanced: Manual Connection
              </button>
            </div>
          </div>
        )}

        {/* View: POLLING (Waiting for user) */}
        {viewState === 'POLLING' && (
          <div className="text-center space-y-6 animate-in fade-in">
             <div className="mx-auto w-16 h-16 border-4 border-plex-orange border-t-transparent rounded-full animate-spin"></div>
             <div>
               <h3 className="text-xl font-bold text-white mb-2">Continue in Popup...</h3>
               <p className="text-sm text-gray-400">We opened a secure Plex login window. <br/>Once you sign in there, we'll automatically connect.</p>
               
               <div className="mt-4 pt-4 border-t border-white/5">
                 <p className="text-xs text-gray-500 mb-2">Popup blocked or closed?</p>
                 <a 
                    href={authUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-plex-orange hover:underline"
                 >
                   Click here to open login manually
                 </a>
               </div>
             </div>
             <button onClick={() => setViewState('INIT')} className="text-xs text-gray-600 hover:text-white">Cancel</button>
          </div>
        )}

        {/* View: SELECT_SERVER */}
        {viewState === 'SELECT_SERVER' && (
          <div className="animate-in fade-in space-y-4">
             <h3 className="text-center text-white font-bold uppercase tracking-widest text-sm mb-4">Select Server</h3>
             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {servers.length === 0 && <p className="text-center text-gray-500 text-sm">No servers found.</p>}
                {servers.map(server => (
                   <button 
                     key={server.clientIdentifier}
                     onClick={() => handleServerSelect(server)}
                     className="w-full flex items-center justify-between p-4 bg-black/40 hover:bg-plex-orange/10 border border-white/5 hover:border-plex-orange/50 rounded-lg transition-all text-left group"
                   >
                     <div>
                       <div className="font-bold text-white group-hover:text-plex-orange">{server.name}</div>
                       <div className="text-[10px] text-gray-500 uppercase">
                         {server.owned ? <span className="text-green-500">My Server</span> : <span className="text-blue-400">Shared {server.sourceTitle ? `by ${server.sourceTitle}` : ''}</span>}
                         {' • '}
                         {server.connections.some(c => c.local) ? 'Local' : 'Remote'}
                       </div>
                     </div>
                     <div className={`w-2 h-2 rounded-full shadow-lg ${server.owned ? 'bg-green-500 shadow-green-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}></div>
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* View: CONNECTING_SERVER */}
        {viewState === 'CONNECTING_SERVER' && (
          <div className="text-center space-y-6 animate-in fade-in">
             <div className="mx-auto w-12 h-12 border-2 border-white/20 border-t-plex-orange rounded-full animate-spin"></div>
             <p className="text-sm text-plex-orange font-mono animate-pulse">{connectionStatus}</p>
          </div>
        )}

        {/* View: MANUAL (Old way) */}
        {viewState === 'MANUAL' && (
          <form onSubmit={handleManualSubmit} className="space-y-6 animate-in fade-in">
            <h3 className="text-center text-white font-bold uppercase tracking-widest text-sm">Manual Connection</h3>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Server URL</label>
              <input 
                type="text" 
                placeholder="http://192.168.1.50:32400"
                className="w-full bg-plex-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-plex-orange focus:outline-none"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Token</label>
              <input 
                type="password" 
                className="w-full bg-plex-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-plex-orange focus:outline-none"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setViewState('INIT')}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider"
              >
                Back
              </button>
              <button 
                type="submit" 
                className="flex-[2] bg-plex-orange hover:bg-yellow-500 text-black font-bold py-3 rounded-lg text-xs uppercase tracking-wider"
              >
                Connect
              </button>
            </div>
          </form>
        )}
        
        {/* Footer Actions */}
        {viewState === 'INIT' && (
          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <button 
              onClick={onDemo}
              className="text-gray-500 hover:text-white text-sm uppercase tracking-wider transition-colors"
            >
              Try Demo Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
