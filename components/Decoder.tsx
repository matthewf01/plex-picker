
import React, { useState, useEffect } from 'react';
import { DecoderSelection } from '../types';
import { Wheel } from './Wheel';

interface DecoderProps {
  onDecode: (selection: DecoderSelection) => void;
  loading: boolean;
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
  "Dark & Gritty",
  "Feel Good",
  "Edge of Seat",
  "Family Fun",
  "80s Nostalgia",
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

export const Decoder: React.FC<DecoderProps> = ({ onDecode, loading }) => {
  // STRICTLY Default to 'any'
  const [type, setType] = useState<any>('any');
  const [history, setHistory] = useState<any>('any');
  const [vibe, setVibe] = useState('any');
  
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
      type,
      history,
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

  return (
    // Top-down flow container with no constraints
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
      
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-3xl font-display font-bold text-white mb-2">Tune Your Pick</h2>
        <p className="text-gray-400">Dial in what you're looking for.</p>
      </div>

      {/* Wheels Container - Stacked Horizontal on Mobile, Side-by-Side Vertical on Desktop */}
      <div className={`w-full flex ${isMobile ? 'flex-col gap-4' : 'flex-row gap-6'} relative z-0 items-start`}>
        <div style={{ flex: 1, width: '100%' }}>
          <Wheel 
            title="Format" 
            options={TYPE_OPTIONS} 
            selected={type} 
            onChange={(id) => setType(id)} 
            onSpin={true}
            orientation={isMobile ? 'horizontal' : 'vertical'}
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
          />
        </div>
      </div>

      {/* MAD LIBS SENTENCE FEEDBACK */}
      <div className="w-full text-center mt-6 md:mt-8 h-auto min-h-[4rem] flex items-center justify-center px-4">
        <p className="text-lg md:text-xl text-gray-400 font-light leading-[2.5rem] md:leading-[4rem] py-2">
          Let's watch a 
          <span className="text-cyan-400 font-bold border border-cyan-500/30 bg-cyan-900/20 rounded-md px-3 py-1 mx-2 shadow-[0_0_15px_rgba(34,211,238,0.1)] whitespace-nowrap">
            {getTypeLabel()}
          </span> 
          that is 
          <span className="text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-900/20 rounded-md px-3 py-1 mx-2 shadow-[0_0_15px_rgba(52,211,153,0.1)] whitespace-nowrap">
            {getHistoryLabel()}
          </span> 
          <br className="hidden md:block" /> 
          and feels like 
          <span className="text-orange-500 font-bold border border-orange-500/30 bg-orange-900/20 rounded-md px-3 py-1 mx-2 shadow-[0_0_15px_rgba(249,115,22,0.1)] whitespace-nowrap">
            {getVibeLabel()}
          </span>.
        </p>
      </div>

      {/* Button Container - Normal Flow */}
      <div className="w-full flex flex-col items-center justify-center pb-20 pt-4" style={{ marginTop: isMobile ? '20px' : '40px' }}>
        <button
          onClick={handleSpin}
          disabled={loading}
          className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden font-bold text-black transition-all duration-300 bg-plex-orange rounded-full hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(229,160,13,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
        >
          <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-80 group-hover:h-80 opacity-20"></span>
          <span className="relative flex items-center gap-3 uppercase tracking-widest text-lg md:text-xl">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Picking...
              </>
            ) : (
              'Pick something to watch'
            )}
          </span>
        </button>

        {/* Loading Hint */}
        {loading && (
          <p className="mt-4 text-sm text-gray-500 animate-pulse text-center max-w-xs">
            This will take a few seconds.. go grab your favorite TV snack!
          </p>
        )}
      </div>
    </div>
  );
};
