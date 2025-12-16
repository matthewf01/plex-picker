
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
  accentColor?: 'cyan' | 'emerald' | 'orange' | 'default';
}

// VERTICAL CONSTANTS
const V_CONTAINER_HEIGHT = 240;
const V_ITEM_HEIGHT = 48;
const V_SPACER = (V_CONTAINER_HEIGHT / 2) - (V_ITEM_HEIGHT / 2);

// HORIZONTAL CONSTANTS
const H_CONTAINER_HEIGHT = 48;
const H_ITEM_WIDTH = 160;

export const Wheel: React.FC<WheelProps> = ({ 
  options, 
  selected, 
  onChange, 
  title, 
  onSpin,
  orientation = 'vertical',
  accentColor = 'default'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State refs for swipe/drag detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isInitialized = useRef(false);
  
  // Mouse Drag State
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const dragDistance = useRef(0);

  // Scroll Lock State (Fixes stuttering)
  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const isHorizontal = orientation === 'horizontal';
  const ITEM_SIZE = isHorizontal ? H_ITEM_WIDTH : V_ITEM_HEIGHT;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  // Initialization & Sync Effect
  useEffect(() => {
    if (!containerRef.current) return;

    // Skip auto-scrolling if user is actively dragging (prevents jitter)
    if (isDragging.current) return;

    const index = options.findIndex(o => o.id === selected);
    // If selected ID isn't found, default to 0
    const targetIndex = index >= 0 ? index : 0;
    
    const scrollToTarget = (behavior: ScrollBehavior = 'smooth') => {
      if (!containerRef.current) return;
      
      // LOCK: Prevent handleScroll from triggering onChange during this animation
      // This breaks the feedback loop where intermediate scroll positions reset the selection
      isProgrammaticScroll.current = true;

      // DISABLE SNAP: Prevent CSS snap from fighting JS smooth scroll on vertical lists
      if (!isHorizontal) {
          containerRef.current.style.scrollSnapType = 'none';
      }
      
      let targetPos = 0;
      if (isHorizontal) {
         // Horizontal: Simple Offset
         targetPos = targetIndex * ITEM_SIZE;
         containerRef.current.scrollTo({ left: targetPos, behavior });
      } else {
         // Vertical: Simple Offset
         targetPos = targetIndex * ITEM_SIZE;
         containerRef.current.scrollTo({ top: targetPos, behavior });
      }

      // UNLOCK: Restore snap and event handling after animation
      // 600ms covers standard browser smooth scroll duration (~300-500ms)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      const delay = behavior === 'auto' ? 50 : 600;

      scrollTimeout.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
          if (containerRef.current && !isHorizontal) {
             containerRef.current.style.scrollSnapType = 'y mandatory';
          }
      }, delay);
    };

    // FORCE Initial Scroll Position
    if (!isInitialized.current) {
        // Instant jump to correct position on mount
        scrollToTarget('auto');
        
        // Double tap: Ensure it sticks after layout paint
        requestAnimationFrame(() => {
           scrollToTarget('auto');
           isInitialized.current = true;
        });
    } else {
        // Normal update
        scrollToTarget('smooth');
    }

  }, [selected, options, isHorizontal, ITEM_SIZE]);

  // Vertical Scroll Handler (Native Scroll Event)
  const handleScroll = () => {
    // IGNORE events if we are programmatically animating.
    // This prevents the "stutter" where the scroll event fires mid-animation
    // and incorrectly updates the state to the previous item.
    if (isHorizontal || !containerRef.current || isProgrammaticScroll.current) return;
    
    const scrollT = containerRef.current.scrollTop;
    let centerIndex = Math.round(scrollT / ITEM_SIZE);
    centerIndex = Math.max(0, Math.min(centerIndex, options.length - 1));

    if (centerIndex >= 0 && centerIndex < options.length) {
      const newId = options[centerIndex].id;
      if (newId !== selected) {
        // Only vibrate if we are the ones initiating the change (not during auto-scroll)
        // We accept the vibration here as feedback.
        if (navigator.vibrate) navigator.vibrate(5);
        onChange(newId);
      }
    }
  };

  // Manual Navigation (Arrows)
  const handleNav = (dir: 'prev' | 'next') => {
      const idx = options.findIndex(o => o.id === selected);
      let newIdx = idx;
      
      if (dir === 'prev') newIdx = Math.max(0, idx - 1);
      if (dir === 'next') newIdx = Math.min(options.length - 1, idx + 1);
      
      if (newIdx !== idx) {
          if (navigator.vibrate) navigator.vibrate(10);
          onChange(options[newIdx].id);
      }
  };

  // Touch Handlers for Mobile (Horizontal)
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isHorizontal) return;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isHorizontal) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!isHorizontal || !touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNav('next');
    } else if (isRightSwipe) {
      handleNav('prev');
    }

    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // --- MOUSE DRAG LOGIC (Vertical/Desktop) ---

  // 1. Mouse Down: Initialize Drag
  const onMouseDown = (e: React.MouseEvent) => {
    if (isHorizontal || !containerRef.current) return;
    
    isDragging.current = true;
    startY.current = e.clientY;
    startScrollTop.current = containerRef.current.scrollTop;
    dragDistance.current = 0;
    
    // Disable snap momentarily for smooth dragging
    containerRef.current.style.scrollSnapType = 'none';
    containerRef.current.style.cursor = 'grabbing';
    
    // Attach window listeners to catch moves outside the div
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
  };

  // 2. Window Mouse Move: Perform Scroll
  const onWindowMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const currentY = e.clientY;
    const delta = currentY - startY.current;
    const dist = Math.abs(delta);
    
    // Only treat as drag if moved more than threshold
    if (dist > 5) {
        e.preventDefault(); // Prevent text selection
        dragDistance.current = dist;
        containerRef.current.scrollTop = startScrollTop.current - delta;
    }
  };

  // 3. Window Mouse Up: Finalize
  const onWindowMouseUp = (e: MouseEvent) => {
    isDragging.current = false;
    
    if (containerRef.current) {
        // Re-enable snap to settle selection
        containerRef.current.style.scrollSnapType = 'y mandatory';
        containerRef.current.style.cursor = 'grab';
    }

    // Clean up listeners
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup', onWindowMouseUp);
  };

  // 4. Container Click: Handle "Click Above/Below" to Step
  const handleContainerClick = (e: React.MouseEvent) => {
    // If drag distance was significant, this is just the tail end of a drag, so ignore.
    if (dragDistance.current > 5 || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    if (isHorizontal) {
        const x = e.clientX - rect.left;
        const centerX = rect.width / 2;
        // Tap Left -> Prev, Tap Right -> Next
        if (x < centerX) handleNav('prev');
        else handleNav('next');
    } else {
        const y = e.clientY - rect.top;
        const centerY = rect.height / 2;
        // Tap Top -> Prev, Tap Bottom -> Next
        if (y < centerY) handleNav('prev');
        else handleNav('next');
    }
  };
  
  // Clean up on unmount just in case
  useEffect(() => {
    return () => {
       window.removeEventListener('mousemove', onWindowMouseMove);
       window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, []);

  // Resolve Arrow Colors
  const getArrowColorClass = () => {
    switch(accentColor) {
      case 'cyan': return 'text-cyan-400';
      case 'emerald': return 'text-emerald-400';
      case 'orange': return 'text-orange-400';
      default: return 'text-white';
    }
  };

  const arrowColor = getArrowColorClass();

  return (
    <div className={`flex flex-col w-full select-none relative group ${isHorizontal ? 'items-start' : ''}`}>
      {title && <div className="text-center text-xs uppercase tracking-[0.2em] text-plex-orange mb-2 font-bold h-4 w-full">{title}</div>}
      
      <div 
        className="relative bg-plex-slate/30 rounded-lg border border-white/5 w-full transition-all"
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

        {/* NAVIGATION BUTTONS (Horizontal Only) */}
        {isHorizontal && (
            <>
                <button 
                    onClick={() => handleNav('prev')}
                    className={`absolute left-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/20 hover:scale-105`}
                    aria-label="Previous"
                >
                    <svg className={`w-5 h-5 ${arrowColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>

                <button 
                    onClick={() => handleNav('next')}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/20 hover:scale-105`}
                    aria-label="Next"
                >
                    <svg className={`w-5 h-5 ${arrowColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
            </>
        )}
        
        {/* Scroll Container */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          // Touch (Mobile)
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          // Mouse (Desktop Drag)
          onMouseDown={onMouseDown}
          // Click (Desktop Tap empty space)
          onClick={handleContainerClick}
          
          className={`
            w-full h-full relative z-20
            ${isHorizontal ? 'flex flex-row items-center overflow-hidden touch-pan-y' : 'overflow-auto hide-scrollbar snap-y snap-mandatory cursor-grab'}
          `}
        >
          {/* Spacers */}
          {isHorizontal ? (
             <div className="flex-shrink-0 transition-[width]" style={{ width: 'calc(50% - 80px)' }}></div>
          ) : (
             <div style={{ height: `${V_SPACER}px` }} className="w-full flex-shrink-0 pointer-events-none"></div>
          )}
          
          {options.map((opt, idx) => (
            <div 
              key={opt.id}
              onClick={(e) => {
                   // CRITICAL: Stop propagation so container click doesn't also fire
                   e.stopPropagation();
                   
                   // Only trigger selection if we haven't dragged significantly
                   if (dragDistance.current < 5) {
                      onChange(opt.id);
                   }
              }}
              className={`
                flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer
                ${isHorizontal ? 'h-full' : 'snap-center w-full'}
                ${selected === opt.id ? 'text-white font-bold scale-110 opacity-100' : 'text-gray-300 font-medium scale-90 opacity-60'}
              `}
              style={{ 
                height: isHorizontal ? '100%' : `${V_ITEM_HEIGHT}px`,
                width: isHorizontal ? `${H_ITEM_WIDTH}px` : 'auto',
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
      
      <style>{`
        .wheel-mask-h {
           mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
           -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
        }
      `}</style>
    </div>
  );
};
