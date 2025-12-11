import React, { useState, useEffect, useMemo } from 'react';
import { Setup } from './components/Setup';
import { Decoder } from './components/Decoder';
import { Results } from './components/Results';
import { PlexService } from './services/plexService';
import { GeminiService } from './services/geminiService';
import { AppState, PlexServerConfig, PlexMediaItem, DecoderSelection, Recommendation } from './types';

const STORAGE_KEY = 'plex_config';
const BUILD_NUMBER = '250222.7';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [config, setConfig] = useState<PlexServerConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedAuthToken, setCachedAuthToken] = useState<string | undefined>(undefined);
  
  const [libraryItems, setLibraryItems] = useState<PlexMediaItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [currentSelection, setCurrentSelection] = useState<DecoderSelection | null>(null);
  
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
    
    // Load mock data
    const demoService = new PlexService(undefined);
    loadLibraryData(demoService);
  };

  const handleDecode = async (selection: DecoderSelection) => {
    setLoading(true);
    setCurrentSelection(selection);
    
    // 1. Client-side Filter
    let candidates = libraryItems.filter(item => {
      // Filter Type
      if (selection.type !== 'any' && item.type !== selection.type) return false;
      
      // Filter History
      if (selection.history === 'unwatched' && (item.viewCount || 0) > 0) return false;
      if (selection.history === 'favorite' && (item.viewCount || 0) === 0) return false;
      
      return true;
    });

    // 2. AI Selection
    const results = await geminiService.getRecommendations(candidates, selection);
    
    setRecommendations(results);
    setAppState(AppState.RESULTS);
    setLoading(false);
  };

  const handleReset = () => {
    setAppState(AppState.DECODER);
    setRecommendations([]);
    setCurrentSelection(null);
  };

  const handleSwitchServer = () => {
    if (config?.token) {
        setCachedAuthToken(config.token);
    }
    localStorage.removeItem(STORAGE_KEY);
    setConfig(null);
    setAppState(AppState.SETUP);
    setLibraryItems([]);
    setError(null);
  };

  // Render Logic
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-plex-orange selection:text-black overflow-y-auto relative">
      
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-plex-slate via-black to-black pointer-events-none z-0"></div>
      
      {/* Build Number */}
      <div className="fixed bottom-2 right-2 text-[9px] text-white/10 font-mono pointer-events-none z-[9999] select-none">
        MF Build: {BUILD_NUMBER}
      </div>

      {/* Content */}
      <main className="relative z-10 min-h-screen flex flex-col">
        {/* Header / Nav */}
        <header className="p-6 flex justify-between items-center bg-black/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="font-display font-bold text-xl tracking-tight text-white/90">
            PLEX<span className="text-plex-orange">PICKER</span>
          </div>
          {appState !== AppState.SETUP && (
            <button 
              onClick={handleSwitchServer}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              Switch Server
            </button>
          )}
        </header>

        {/* 
           Layout Fix: 
           - justify-start + pt-12 anchors content to top
        */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-12 p-4">
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
              onDecode={handleDecode} 
              loading={loading} 
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
        
        {/* Footer */}
        <footer className="p-6 text-center text-gray-800 text-xs">
          Powered by Gemini AI • Not affiliated with Plex Inc.
        </footer>
      </main>
    </div>
  );
}

export default App;