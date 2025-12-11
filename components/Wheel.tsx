
import React, { useRef, useEffect } from 'react';

export interface WheelOption {
  id: string;
  label: string;
}

interface WheelProps {
  options: WheelOption[];
  selected: string;
  onChange: (id: string) => void;
  title?: string;
  onSpin?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

// VERTICAL CONSTANTS
const V_CONTAINER_HEIGHT = 240;
const V_ITEM_HEIGHT = 48;
const V_SPACER = (V_CONTAINER_HEIGHT / 2) - (V_ITEM_HEIGHT / 2); // 96px

// HORIZONTAL CONSTANTS
const H_CONTAINER_HEIGHT = 40; // Super compact for mobile text only
const H_ITEM_WIDTH = 160;      // Wide enough for text
// Horizontal spacers are calculated dynamically via CSS/calc usually

export const Wheel: React.FC<WheelProps> = ({ 
  options, 
  selected, 
  onChange, 
  title, 
  onSpin,
  orientation = 'vertical'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const scrollPos = useRef(0);
  const isMoved = useRef(false);
  const hasSpun = useRef(false);
  const isSpinning = useRef(false); // Lock for intro animation

  const isHorizontal = orientation === 'horizontal';
  const ITEM_SIZE = isHorizontal ? H_ITEM_WIDTH : V_ITEM_HEIGHT;

  // Initial Spin Effect & Selection Scroll
  useEffect(() => {
    if (containerRef.current && !isDragging.current) {
      const index = options.findIndex(o => o.id === selected);
      
      const scrollToTarget = (behavior: ScrollBehavior = 'smooth') => {
        if (!containerRef.current) return;
        
        if (isHorizontal) {
          // Calculate center for horizontal
          const containerW = containerRef.current.clientWidth;
          const targetLeft = (index * ITEM_SIZE) - (containerW / 2) + (ITEM_SIZE / 2);
          
          containerRef.current.scrollTo({
            left: Math.max(0, targetLeft),
            behavior
          });
        } else {
          containerRef.current.scrollTo({
            top: index * ITEM_SIZE,
            behavior
          });
        }
      };

      // Intro Spin (Vertical Only)
      if (onSpin && !hasSpun.current && !isHorizontal) {
        hasSpun.current = true;
        isSpinning.current = true; // LOCK selection updates
        
        // Start from bottom (simulate spin)
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        
        // Smooth scroll to target
        setTimeout(() => {
          if (!isDragging.current) {
             scrollToTarget();
          }
          
          // UNLOCK after animation + buffer
          setTimeout(() => {
            isSpinning.current = false;
            if (containerRef.current && !isDragging.current) {
               scrollToTarget('auto'); // Snap force
            }
          }, 1000);
        }, 100);
      } else {
        // Normal update or Horizontal init
        if (index !== -1 && !isSpinning.current) {
           scrollToTarget();
        }
      }
    }
  }, [selected, options, onSpin, isHorizontal, ITEM_SIZE]);

  const handleScroll = () => {
    if (!containerRef.current || isSpinning.current) return; // Ignore if spinning/locked
    
    let centerIndex = 0;
    
    if (isHorizontal) {
      const scrollL = containerRef.current.scrollLeft;
      const containerW = containerRef.current.clientWidth;
      const centerPoint = scrollL + (containerW / 2);
      centerIndex = Math.floor(centerPoint / ITEM_SIZE);
    } else {
      const scrollT = containerRef.current.scrollTop;
      centerIndex = Math.round(scrollT / ITEM_SIZE);
    }
    
    // Clamp
    centerIndex = Math.max(0, Math.min(centerIndex, options.length - 1));

    if (centerIndex >= 0 && centerIndex < options.length) {
      const newId = options[centerIndex].id;
      if (newId !== selected) {
        if (navigator.vibrate) navigator.vibrate(5);
        onChange(newId);
      }
    }
  };

  // --- MOUSE/TOUCH HANDLERS (Unified Logic) ---
  const handleStart = (pos: number) => {
    if (!containerRef.current) return;
    isSpinning.current = false;
    isDragging.current = true;
    isMoved.current = false;
    startPos.current = pos;
    scrollPos.current = isHorizontal ? containerRef.current.scrollLeft : containerRef.current.scrollTop;
    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.scrollSnapType = 'none';
  };

  const handleMove = (pos: number) => {
    if (!isDragging.current || !containerRef.current) return;
    isMoved.current = true;
    // Reduced multiplier to make it feel heavier and stickier
    const delta = (pos - startPos.current) * 1.1; 
    
    if (isHorizontal) {
       containerRef.current.scrollLeft = scrollPos.current - delta;
    } else {
       containerRef.current.scrollTop = scrollPos.current - delta;
    }
  };

  const handleEnd = () => {
    if (!isDragging.current || !containerRef.current) return;
    isDragging.current = false;
    containerRef.current.style.cursor = 'grab';
    // Re-enable snap
    containerRef.current.style.scrollSnapType = isHorizontal ? 'x mandatory' : 'y mandatory';
  };

  return (
    <div className={`flex flex-col w-full select-none ${isHorizontal ? 'items-start' : ''}`}>
      {title && <div className="text-center text-xs uppercase tracking-[0.2em] text-plex-orange mb-2 font-bold h-4 w-full">{title}</div>}
      
      <div 
        className="relative overflow-hidden bg-plex-slate/30 rounded-lg border border-white/5 w-full transition-all"
        style={{ height: isHorizontal ? `${H_CONTAINER_HEIGHT}px` : `${V_CONTAINER_HEIGHT}px` }} 
      >
        
        {/* Gradients / Masks */}
        <div className={`absolute inset-0 pointer-events-none z-10 ${isHorizontal ? 'wheel-mask-h' : 'wheel-mask'}`}></div>
        
        {/* Center Highlight Indicator */}
        {isHorizontal ? (
          <div className="absolute top-0 bottom-0 left-1/2 w-[160px] -ml-[80px] bg-white/5 border-x border-white/10 pointer-events-none z-0 backdrop-blur-[1px]"></div>
        ) : (
          <div className="absolute top-1/2 left-0 right-0 h-12 -mt-6 bg-white/5 border-y border-white/10 pointer-events-none z-0 backdrop-blur-[1px]"></div>
        )}
        
        {/* Scroll Container */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          
          onMouseDown={(e) => handleStart(isHorizontal ? e.pageX : e.pageY)}
          onMouseMove={(e) => { e.preventDefault(); handleMove(isHorizontal ? e.pageX : e.pageY); }}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          
          onTouchStart={(e) => handleStart(isHorizontal ? e.touches[0].pageX : e.touches[0].pageY)}
          onTouchMove={(e) => handleMove(isHorizontal ? e.touches[0].pageX : e.touches[0].pageY)}
          onTouchEnd={handleEnd}
          
          className={`
            w-full h-full overflow-auto hide-scrollbar relative z-20 cursor-grab touch-pan-x touch-pan-y
            ${isHorizontal ? 'flex flex-row snap-x snap-mandatory overflow-y-hidden items-center' : 'snap-y snap-mandatory overflow-x-hidden'}
          `}
        >
          {/* Spacers - Explicitly center items in the scroll view */}
          {isHorizontal ? (
             <div className="flex-shrink-0" style={{ width: 'calc(50% - 80px)' }}></div>
          ) : (
             <div style={{ height: `${V_SPACER}px` }} className="w-full flex-shrink-0 pointer-events-none"></div>
          )}
          
          {options.map((opt, idx) => (
            <div 
              key={opt.id}
              onClick={() => {
                 // Manual click to center
                 if (!isMoved.current) {
                   const index = idx;
                   if (isHorizontal && containerRef.current) {
                      const containerW = containerRef.current.clientWidth;
                      const targetLeft = (index * ITEM_SIZE) - (containerW / 2) + (ITEM_SIZE / 2);
                      containerRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
                   } else if (containerRef.current) {
                      containerRef.current.scrollTo({ top: index * ITEM_SIZE, behavior: 'smooth' });
                   }
                 }
              }}
              className={`
                flex items-center justify-center transition-all duration-200 flex-shrink-0
                ${isHorizontal ? 'snap-center h-full' : 'snap-center w-full'}
                ${selected === opt.id ? 'text-white font-bold scale-110 opacity-100' : 'text-gray-500 font-light scale-90 opacity-40'}
              `}
              style={{ 
                height: isHorizontal ? '100%' : `${V_ITEM_HEIGHT}px`,
                width: isHorizontal ? `${H_ITEM_WIDTH}px` : 'auto',
                // This property forces the scroll to stop at each item (no free flicking)
                scrollSnapStop: 'always' 
              }}
            >
              <span className="uppercase tracking-widest text-sm whitespace-nowrap px-4 pointer-events-none">{opt.label}</span>
            </div>
          ))}
          
          {/* Bottom/Right Spacer */}
          {isHorizontal ? (
             <div className="flex-shrink-0" style={{ width: 'calc(50% - 80px)' }}></div>
          ) : (
             <div style={{ height: `${V_SPACER + 350}px` }} className="w-full flex-shrink-0 pointer-events-none"></div>
          )}
        </div>
      </div>
      
      {/* Horizontal Mask Styles injected dynamically or via class */}
      <style>{`
        .wheel-mask-h {
           mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
           -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
        }
      `}</style>
    </div>
  );
};
