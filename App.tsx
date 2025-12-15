
import React, { useState, useEffect, useMemo } from 'react';
import { Setup } from './components/Setup';
import { Decoder } from './components/Decoder';
import { Results } from './components/Results';
import { About } from './components/About';
import { Privacy } from './components/Privacy';
import { Support } from './components/Support';
import { PlexService } from './services/plexService';
import { GeminiService } from './services/geminiService';
import { AppState, PlexServerConfig, PlexMediaItem, DecoderSelection, Recommendation, OverlayState } from './types';

const STORAGE_KEY = 'plex_config';
const BUILD_NUMBER = '250222.28';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  
  const [config, setConfig] = useState<PlexServerConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAuthToken, setCachedAuthToken] = useState<string | undefined>(undefined);
  
  const [libraryItems, setLibraryItems] = useState<PlexMediaItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentSelection, setCurrentSelection] = useState<DecoderSelection | null>(null);
  const [decoderKey, setDecoderKey] = useState(0);
  
  // Services
  const geminiService = useMemo(() => new GeminiService(), []);
  
  // Initialize Plex Service on config change
  const plexService = useMemo(() => new PlexService(config || undefined), [config]);

  useEffect(() => {
    // 1. Load Server Config
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
        validateAndLoad(parsed);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const validateAndLoad = async (cfg: PlexServerConfig) => {
    setAppState(AppState.LOADING);
    setError(null);
    
    // Create a temp service instance to validate this specific config
    const tempService = new PlexService(cfg);
    
    try {
      const serverIdentifier = await tempService.validateConnection();
      
      // If successful:
      // Store identifier in config if it's a string, or just keep config as is
      const finalConfig = typeof serverIdentifier === 'string' 
        ? { ...cfg, machineIdentifier: serverIdentifier } 
        : cfg;
        
      setConfig(finalConfig);
      setAppState(AppState.DECODER);
      setDecoderKey(prev => prev + 1); // Ensure fresh state
      
      // Start loading libraries in background
      loadLibraryData(tempService);

    } catch (e: any) {
      console.error("Connection failed", e);
      setError(e.message || "Could not connect to Plex Server");
      setAppState(AppState.SETUP);
    }
  };

  const loadLibraryData = async (service: PlexService) => {
    setLoading(true);
    try {
      // Fetch Libraries
      const libs = await service.getLibraries();
      let allItems: PlexMediaItem[] = [];
      
      // Fetch items from all Movie/TV libraries
      for (const lib of libs) {
        const items = await service.getAllItems(lib.key);
        allItems = [...allItems, ...items];
      }

      setLibraryItems(allItems);
    } catch (e: any) {
      console.error("Failed to load library data", e);
      setError("Failed to load libraries: " + (e.message || "Unknown error"));
      setAppState(AppState.SETUP);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (newConfig: PlexServerConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    validateAndLoad(newConfig);
  };

  const handleDemo = () => {
    setConfig(null); // Null config triggers demo mode in PlexService
    setAppState(AppState.DECODER);
    setDecoderKey(prev => prev + 1);
    
    // Load mock data
    const demoService = new PlexService(undefined);
    loadLibraryData(demoService);
  };

  const handleDecode = async (selection: DecoderSelection) => {
    if (libraryItems.length === 0) {
      setError("Your library seems to be empty or is still loading. Please wait a moment or check your connection.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setCurrentSelection(selection);
    
    // 1. Filter Client-side
    let candidates = libraryItems.filter(item => {
      // Filter Type
      if (selection.type !== 'any' && item.type !== selection.type) return false;
      
      // Filter History
      if (selection.history === 'unwatched' && (item.viewCount || 0) > 0) return false;
      if (selection.history === 'favorite' && (item.viewCount || 0) === 0) return false;
      
      return true;
    });

    if (candidates.length === 0) {
      setError(`No matches found for ${selection.type === 'any' ? 'media' : selection.type} in your library matching filter: ${selection.history}`);
      setLoading(false);
      return;
    }

    try {
      // 2. AI Selection
      const results = await geminiService.getRecommendations(candidates, selection);
      
      if (results.length === 0) {
         setError("AI could not find a suitable match. Try a different vibe!");
         setLoading(false);
         return;
      }
      
      setRecommendations(results);
      setAppState(AppState.RESULTS);
    } catch (e: any) {
      console.error("Recommendation Error", e);
      setError(e.message || "Failed to get recommendations from AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAppState(AppState.DECODER);
    setRecommendations([]);
    setCurrentSelection(null);
    setDecoderKey(prev => prev + 1); // Force new Decoder instance (reset selections)
  };

  const handleSwitchServer = () => {
    // Prefer Master Token for server switching if available
    if (config?.masterToken) {
        setCachedAuthToken(config.masterToken);
    } else if (config?.token) {
        setCachedAuthToken(config.token);
    }
    localStorage.removeItem(STORAGE_KEY);
    setConfig(null);
    setAppState(AppState.SETUP);
    setLibraryItems([]);
    setError(null);
  };

  const handleCloseOverlay = () => {
    setOverlay(null);
  };

  const handleLogoClick = () => {
    if (config) {
      setAppState(AppState.DECODER);
      setDecoderKey(prev => prev + 1); // Force reset when clicking logo
    } else {
      setAppState(AppState.SETUP);
    }
    setOverlay(null);
  };

  // Render Logic
  return (
    <div className="h-[100dvh] bg-black text-white font-sans selection:bg-plex-orange selection:text-black overflow-hidden relative flex flex-col">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-plex-slate via-black to-black pointer-events-none z-0"></div>
      
      {/* Build Number */}
      <div className="fixed bottom-2 right-2 text-[10px] text-gray-600 font-mono pointer-events-none z-[9999] select-none">
        MF Build: {BUILD_NUMBER}
      </div>

      {/* Global Error Toast */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none">
          <div className="bg-red-900/90 border border-red-500/50 text-white px-6 py-4 rounded-lg shadow-2xl flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-5 pointer-events-auto">
            <svg className="w-6 h-6 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="flex-1">
              <h4 className="font-bold text-sm uppercase tracking-wider mb-1">System Error</h4>
              <p className="text-sm text-red-100">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* OVERLAYS (Modals) */}
      {overlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop - Transparent to show Glassmorphism */}
           <div 
             className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
             onClick={handleCloseOverlay}
           ></div>
           
           {/* Modal Content */}
           <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
             {overlay === 'ABOUT' && <About onClose={handleCloseOverlay} onDonate={() => setOverlay('SUPPORT')} />}
             {overlay === 'PRIVACY' && <Privacy onClose={handleCloseOverlay} />}
             {overlay === 'SUPPORT' && <Support onClose={handleCloseOverlay} />}
           </div>
        </div>
      )}

      {/* HEADER (Sticky Top, Non-scrolling) */}
      <header className="flex-none p-4 md:p-6 flex justify-between items-center bg-black/50 backdrop-blur-sm z-40 border-b border-white/5 relative">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <button onClick={handleLogoClick} className="font-display font-bold text-xl tracking-tight text-white/90 hover:opacity-80 transition-opacity text-left">
              PLEX<span className="text-plex-orange">PICKER</span>
          </button>
          
          {/* Server Status & Switch */}
          {config && appState !== AppState.SETUP && (
              <div className="flex items-center gap-3 pl-0 md:pl-4 md:border-l md:border-white/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      {config.serverName || 'Server'}
                  </span>
                  <button 
                      onClick={handleSwitchServer}
                      className="text-xs font-bold uppercase tracking-widest text-purple-400 italic hover:text-white transition-colors"
                  >
                      (Switch)
                  </button>
              </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={() => setOverlay('ABOUT')} className="hidden md:block text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">About</button>
          <button onClick={() => setOverlay('PRIVACY')} className="hidden md:block text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Privacy</button>
          
          <button 
              onClick={() => setOverlay('SUPPORT')}
              className="text-xs font-bold uppercase tracking-widest text-plex-orange hover:text-white transition-colors"
          >
              Donate
          </button>
        </div>
      </header>

      {/* MAIN CONTENT (Scrollable Area) */}
      {/* Changed logic: Main is a flex-col. Content takes flex-1. Footer is last. */}
      <main className={`flex-1 relative z-10 overflow-y-auto overflow-x-hidden flex flex-col transition-filter duration-300 ${overlay ? 'blur-sm grayscale-[50%]' : ''}`}>
        
        {/* Content Wrapper */}
        <div className="flex-1 w-full flex flex-col items-center justify-start pt-4 md:pt-12 p-4 pb-0">
          {appState === AppState.SETUP && (
            <Setup 
                onConnect={handleConnect} 
                onDemo={handleDemo} 
                loading={false} 
                error={error} 
                initialToken={cachedAuthToken}
            />
          )}

          {(appState === AppState.LOADING) && (
             <div className="flex flex-col items-center animate-pulse mt-20">
                <div className="w-16 h-16 border-4 border-plex-orange border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-plex-orange font-display tracking-widest uppercase text-sm">Accessing Mainframe...</p>
             </div>
          )}

          {appState === AppState.DECODER && (
            <Decoder 
              key={decoderKey}
              onDecode={handleDecode} 
              loading={loading} 
              isLibraryReady={libraryItems.length > 0}
            />
          )}

          {appState === AppState.RESULTS && (
            <Results 
              recommendations={recommendations} 
              selection={currentSelection} 
              onReset={handleReset}
              serverIdentifier={config?.machineIdentifier}
            />
          )}
        </div>
        
        {/* Footer - Sits naturally at bottom of flex column */}
        <footer className="flex-none p-6 md:p-8 text-center text-gray-500 text-xs flex flex-col gap-2 border-t border-white/5 bg-black/20 backdrop-blur-sm mt-auto">
          <div>Developed by Matthew F. • AI features powered by Google Gemini • Not affiliated with Plex Inc.</div>
          <div className="flex justify-center gap-6 font-medium tracking-wide">
             <button onClick={() => setOverlay('ABOUT')} className="hover:text-plex-orange transition-colors">About</button>
             <button onClick={() => setOverlay('PRIVACY')} className="hover:text-plex-orange transition-colors">Privacy</button>
             <button onClick={() => setOverlay('SUPPORT')} className="hover:text-plex-orange transition-colors">Donate</button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
