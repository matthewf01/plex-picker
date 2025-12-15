
import React, { useState, useEffect } from 'react';
import { DecoderSelection } from '../types';
import { Wheel } from './Wheel';

interface DecoderProps {
  onDecode: (selection: DecoderSelection) => void;
  loading: boolean;
  isLibraryReady?: boolean;
}

const TYPE_OPTIONS = [
  { id: 'any', label: 'Surprise Me' },
  { id: 'movie', label: 'Movie' },
  { id: 'show', label: 'TV Show' }
];

const HISTORY_OPTIONS = [
  { id: 'any', label: 'All' }, 
  { id: 'unwatched', label: 'Unwatched' },
  { id: 'favorite', label: 'Rewatch' }
];

const VIBE_STRINGS = [
  "Date Night",
  "Mind Bending",
  "Brain Off / Popcorn",
  "Scary",
  "Dark & Gritty",
  "Feel Good",
  "Emotionally Moving",
  "Edge of Seat",
  "Family Fun",
  "Nostalgia",
  "The Holidays",
  "Dystopian",
  "Short & Sweet",
  "Critically Acclaimed",
  "Hidden Gem",
  "Slow Burn",
  "Visual Masterpiece",
  "Documentary"
];

// Combine "Any" with presets
const VIBE_OPTIONS = [
  { id: 'any', label: 'Open to Anything' },
  ...VIBE_STRINGS.map(v => ({ id: v, label: v }))
];

export const Decoder: React.FC<DecoderProps> = ({ onDecode, loading, isLibraryReady = true }) => {
  // STRICTLY Default to the first option in the list
  const [type, setType] = useState<string>(TYPE_OPTIONS[0].id);
  const [history, setHistory] = useState<string>(HISTORY_OPTIONS[0].id);
  const [vibe, setVibe] = useState<string>(VIBE_OPTIONS[0].id);
  
  // Force reset to defaults on mount (redundant safety for "page load" requirement)
  useEffect(() => {
    setType(TYPE_OPTIONS[0].id);
    setHistory(HISTORY_OPTIONS[0].id);
    setVibe(VIBE_OPTIONS[0].id);
  }, []);
  
  // Responsive check
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSpin = () => {
    onDecode({
      type: type as any,
      history: history as any,
      vibe
    });
  };

  // Mad Libs Sentence Generation
  const getTypeLabel = () => {
    const t = TYPE_OPTIONS.find(o => o.id === type);
    return t?.label === 'Surprise Me' ? 'Movie or Show' : t?.label || 'Media';
  };
  
  const getHistoryLabel = () => {
    const h = HISTORY_OPTIONS.find(o => o.id === history);
    if (h?.id === 'unwatched') return 'Something New';
    if (h?.id === 'favorite') return 'Familiar';
    return 'New or Familiar';
  };

  const getVibeLabel = () => {
    if (vibe === 'any') return 'a Surprise';
    return `"${vibe}"`;
  }

  // Determine Button Text and Status
  const getButtonContent = () => {
    if (loading) {
       if (!isLibraryReady) {
         return (
           <>
             <svg className="animate-spin -ml-1 h-5 w-5 md:h-6 md:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             Scanning Library...
           </>
         );
       }
       return (
          <>
            <svg className="animate-spin -ml-1 h-5 w-5 md:h-6 md:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Picking...
          </>
       );
    }
    return 'Pick something to watch';
  };

  return (
    // Top-down flow container with no constraints
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
      
      {/* Header */}
      <div className="text-center mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-1 md:mb-2">What are you in the mood for?</h2>
        <p className="text-sm md:text-base text-gray-400">Dial it in - the Picker AI will find the perfect match.</p>
      </div>

      {/* Wheels Container - Tight gap on mobile */}
      <div className={`w-full flex ${isMobile ? 'flex-col gap-1' : 'flex-row gap-6'} relative z-0 items-start`}>
        <div style={{ flex: 1, width: '100%' }}>
          <Wheel 
            title="Format" 
            options={TYPE_OPTIONS} 
            selected={type} 
            onChange={(id) => setType(id)} 
            onSpin={true}
            orientation={isMobile ? 'horizontal' : 'vertical'}
            accentColor="cyan"
          />
        </div>
        <div style={{ flex: 1, width: '100%' }}>
          <Wheel 
            title="History" 
            options={HISTORY_OPTIONS} 
            selected={history} 
            onChange={(id) => setHistory(id)}
            onSpin={true} 
            orientation={isMobile ? 'horizontal' : 'vertical'}
            accentColor="emerald"
          />
        </div>
        <div style={{ flex: 1, width: '100%' }}>
          <Wheel 
            title="Mood" 
            options={VIBE_OPTIONS} 
            selected={vibe} 
            onChange={(id) => setVibe(id)} 
            onSpin={true}
            orientation={isMobile ? 'horizontal' : 'vertical'}
            accentColor="orange"
          />
        </div>
      </div>

      {/* MAD LIBS SENTENCE FEEDBACK */}
      <div className="w-full text-center mt-4 md:mt-6 h-auto min-h-[4rem] flex items-center justify-center px-0">
        <p className="text-base md:text-xl text-gray-400 font-light leading-relaxed py-2 w-full break-words">
          Let's watch a 
          <span className="text-cyan-400 font-bold border border-cyan-500/30 bg-cyan-900/20 rounded-md px-2 md:px-3 py-0.5 md:py-1 mx-1 md:mx-2 shadow-[0_0_15px_rgba(34,211,238,0.1)] whitespace-nowrap">
            {getTypeLabel()}
          </span> 
          that is 
          <span className="text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-900/20 rounded-md px-2 md:px-3 py-0.5 md:py-1 mx-1 md:mx-2 shadow-[0_0_15px_rgba(52,211,153,0.1)] whitespace-nowrap">
            {getHistoryLabel()}
          </span> 
          <span className="inline-block mt-1 md:mt-0">
             and feels like 
             <span className="text-orange-500 font-bold border border-orange-500/30 bg-orange-900/20 rounded-md px-2 md:px-3 py-0.5 md:py-1 mx-1 md:mx-2 shadow-[0_0_15px_rgba(249,115,22,0.1)] whitespace-nowrap">
               {getVibeLabel()}
             </span>.
          </span>
        </p>
      </div>

      {/* Button Container */}
      <div className="w-full flex flex-col items-center justify-center pb-20 pt-2" style={{ marginTop: isMobile ? '10px' : '40px' }}>
        <button
          onClick={handleSpin}
          disabled={loading}
          className="group relative inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-5 font-bold text-white transition-all duration-300 bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
        >
          <span className="relative flex items-center gap-3 uppercase tracking-widest text-base md:text-xl">
             {getButtonContent()}
          </span>
        </button>

        {/* Loading Hint */}
        {loading && (
          <p className="mt-4 text-xs md:text-sm text-gray-500 animate-pulse text-center max-w-xs">
            {isLibraryReady 
               ? "This will take a few seconds.. go grab your favorite TV snack!"
               : "Connecting to your Plex server and indexing movies..."
            }
          </p>
        )}
      </div>
    </div>
  );
};
