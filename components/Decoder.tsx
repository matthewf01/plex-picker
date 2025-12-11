
import React, { useState, useRef, useEffect } from 'react';
import { DecoderSelection } from '../types';

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

// Wheel Component with Drag-to-Scroll and PIXEL PERFECT HEIGHTS
const Wheel = ({ options, selected, onChange, title, onSpin }: { 
  options: { id: string; label: string }[], 
  selected: string, 
  onChange: (id: string) => void,
  title: string,
  onSpin?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // CONSTANTS - Must match CSS styles exactly
  const CONTAINER_HEIGHT = 240; // px
  const ITEM_HEIGHT = 48; // px
  
  // Drag State
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  const isMoved = useRef(false);
  const hasSpun = useRef(false);
  const isSpinning = useRef(false); // Lock for intro animation

  // Initial Spin Effect & Selection Scroll
  useEffect(() => {
    if (containerRef.current && !isDragging.current) {
      const index = options.findIndex(o => o.id === selected);
      
      // If this is the first load and we want a spin effect
      if (onSpin && !hasSpun.current) {
        hasSpun.current = true;
        isSpinning.current = true; // LOCK selection updates
        
        // Start from bottom (simulate spin)
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        
        // Smooth scroll to target
        setTimeout(() => {
          if (!isDragging.current) { // Only scroll if user hasn't grabbed it
            containerRef.current?.scrollTo({
              top: index * ITEM_HEIGHT,
              behavior: 'smooth'
            });
          }
          
          // UNLOCK after animation + buffer
          setTimeout(() => {
            isSpinning.current = false;
            // Force final snap to ensure alignment
            if (containerRef.current && !isDragging.current) {
               containerRef.current.scrollTop = index * ITEM_HEIGHT;
            }
          }, 1000);
        }, 100);
      } else {
        // Normal update (click or external change)
        if (index !== -1 && !isSpinning.current) {
          containerRef.current.scrollTo({
            top: index * ITEM_HEIGHT,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [selected, options, onSpin]);

  const handleScroll = () => {
    if (!containerRef.current || isSpinning.current) return; // Ignore if spinning/locked
    
    // Calculate index based on strict pixel math
    const currentScrollTop = containerRef.current.scrollTop;
    const centerIndex = Math.round(currentScrollTop / ITEM_HEIGHT);
    
    if (centerIndex >= 0 && centerIndex < options.length) {
      const newId = options[centerIndex].id;
      if (newId !== selected) {
        if (navigator.vibrate) navigator.vibrate(5);
        onChange(newId);
      }
    }
  };

  // --- MOUSE EVENTS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isSpinning.current = false; // Break the lock immediately
    isDragging.current = true;
    isMoved.current = false;
    startY.current = e.pageY - containerRef.current.offsetTop;
    scrollTop.current = containerRef.current.scrollTop;
    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.scrollSnapType = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    isMoved.current = true;
    const y = e.pageY - containerRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5;
    containerRef.current.scrollTop = scrollTop.current - walk;
  };

  // --- TOUCH EVENTS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    isSpinning.current = false; // Break the lock immediately
    isDragging.current = true;
    isMoved.current = false;
    startY.current = e.touches[0].pageY - containerRef.current.offsetTop;
    scrollTop.current = containerRef.current.scrollTop;
    containerRef.current.style.scrollSnapType = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    // e.preventDefault(); 
    isMoved.current = true;
    const y = e.touches[0].pageY - containerRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5;
    containerRef.current.scrollTop = scrollTop.current - walk;
  };

  const stopDragging = () => {
    if (!isDragging.current || !containerRef.current) return;
    isDragging.current = false;
    containerRef.current.style.cursor = 'grab';
    containerRef.current.style.scrollSnapType = 'y mandatory';
    
    // Snap to nearest item on release
    const currentScrollTop = containerRef.current.scrollTop;
    const centerIndex = Math.round(currentScrollTop / ITEM_HEIGHT);
    containerRef.current.scrollTo({
      top: centerIndex * ITEM_HEIGHT,
      behavior: 'smooth'
    });
  };

  const handleMouseLeave = () => stopDragging();
  const handleMouseUp = () => stopDragging();
  const handleTouchEnd = () => stopDragging();

  const handleItemClick = (index: number) => {
    if (isMoved.current) return;
    isSpinning.current = false;
    
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }
  };

  // Fixed calculations for 240px container / 48px item
  // (240 / 2) - (48 / 2) = 120 - 24 = 96px
  const spacerHeight = 96;

  return (
    <div className="flex flex-col w-full select-none">
      <div className="text-center text-xs uppercase tracking-[0.2em] text-plex-orange mb-3 font-bold h-6">{title}</div>
      <div 
        className="relative overflow-hidden bg-plex-slate/30 rounded-xl border border-white/5 w-full"
        style={{ height: '240px' }} 
      >
        
        {/* Gradients / Masks */}
        <div className="absolute inset-0 pointer-events-none z-10 wheel-mask"></div>
        
        {/* Center Highlight Indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-12 -mt-6 bg-white/5 border-y border-white/10 pointer-events-none z-0 backdrop-blur-[1px]"></div>
        
        {/* Scroll Container - Strictly enforced height */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          
          className="w-full overflow-y-auto snap-y snap-mandatory hide-scrollbar relative z-20 cursor-grab touch-pan-y"
          style={{ height: '240px' }}
        >
          {/* Top Spacer */}
          <div style={{ height: `${spacerHeight}px` }} className="w-full flex-shrink-0 pointer-events-none"></div>
          
          {options.map((opt, idx) => (
            <div 
              key={opt.id}
              onClick={() => handleItemClick(idx)}
              className={`
                flex items-center justify-center snap-center transition-all duration-200
                ${selected === opt.id ? 'text-white font-bold scale-110 opacity-100' : 'text-gray-500 font-light scale-90 opacity-40'}
              `}
              style={{ height: '48px' }}
            >
              <span className="uppercase tracking-widest text-sm whitespace-nowrap px-4 pointer-events-none">{opt.label}</span>
            </div>
          ))}
          
          {/* Bottom Spacer - Huge buffer to ensure last items reach center */}
          <div style={{ height: `${spacerHeight + 350}px` }} className="w-full flex-shrink-0 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export const Decoder: React.FC<DecoderProps> = ({ onDecode, loading }) => {
  // STRICTLY Default to 'any'
  const [type, setType] = useState<any>('any');
  const [history, setHistory] = useState<any>('any');
  const [vibe, setVibe] = useState('any');

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
    return h?.label === 'All' ? 'Watched or Unwatched' : h?.label || 'Unwatched';
  };

  const getVibeLabel = () => {
    if (vibe === 'any') return 'a Surprise';
    return `"${vibe}"`;
  }

  return (
    // Top-down flow container with no constraints
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display font-bold text-white mb-2">Tune Your Pick</h2>
        <p className="text-gray-400">Dial in what you're looking for.</p>
      </div>

      {/* Wheels Container - Flex Row with strict 1/3 widths */}
      <div className="flex flex-row w-full gap-3 md:gap-6 relative z-0 items-start">
        <div style={{ flex: 1 }}>
          <Wheel 
            title="Format" 
            options={TYPE_OPTIONS} 
            selected={type} 
            onChange={(id) => setType(id)} 
            onSpin={true}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Wheel 
            title="History" 
            options={HISTORY_OPTIONS} 
            selected={history} 
            onChange={(id) => setHistory(id)}
            onSpin={true} 
          />
        </div>
        <div style={{ flex: 1 }}>
          <Wheel 
            title="Mood" 
            options={VIBE_OPTIONS} 
            selected={vibe} 
            onChange={(id) => setVibe(id)} 
            onSpin={true}
          />
        </div>
      </div>

      {/* MAD LIBS SENTENCE FEEDBACK */}
      <div className="w-full text-center mt-8 h-16 flex items-center justify-center px-4">
        <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed">
          Let's watch a <span className="text-cyan-400 font-bold">{getTypeLabel()}</span> that is <span className="text-emerald-400 font-bold">{getHistoryLabel()}</span> and feels like <span className="text-orange-500 font-bold">{getVibeLabel()}</span>.
        </p>
      </div>

      {/* Button Container - Normal Flow */}
      <div className="w-full flex flex-col items-center justify-center pb-20 pt-4" style={{ marginTop: '40px' }}>
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