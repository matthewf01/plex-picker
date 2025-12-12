
import React, { useRef, useEffect, useState } from 'react';

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
const H_CONTAINER_HEIGHT = 48; // Slightly taller for better touch target
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
  
  // State refs for swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const hasSpun = useRef(false);
  
  const isHorizontal = orientation === 'horizontal';
  const ITEM_SIZE = isHorizontal ? H_ITEM_WIDTH : V_ITEM_HEIGHT;

  // Sync Scroll with Selection
  useEffect(() => {
    if (containerRef.current) {
      const index = options.findIndex(o => o.id === selected);
      if (index === -1) return;

      const scrollToTarget = (behavior: ScrollBehavior = 'smooth') => {
        if (!containerRef.current) return;
        
        let targetPos = 0;
        
        if (isHorizontal) {
           // For horizontal, we are using index-based snapping.
           // Target is simply index * width
           targetPos = index * ITEM_SIZE;
           
           // Force scroll because we disabled overflow
           containerRef.current.scrollTo({ left: targetPos, behavior });
        } else {
           // Vertical keeps native scrolling behavior
           targetPos = index * ITEM_SIZE;
           
           const currentPos = containerRef.current.scrollTop;
           if (Math.abs(currentPos - targetPos) > 2) {
             containerRef.current.scrollTo({ top: targetPos, behavior });
           }
        }
      };

      // Intro Spin Animation (Vertical Only)
      if (onSpin && !hasSpun.current && !isHorizontal) {
        hasSpun.current = true;
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        setTimeout(() => {
             scrollToTarget();
        }, 100);
      } else {
        // Fix for mobile layout glitch: sometimes browser needs a tick to calculate widths correctly
        // especially when switching from hidden/vertical to horizontal
        if (isHorizontal) {
          setTimeout(() => scrollToTarget('auto'), 0); // Immediate instant scroll on mount/change
          setTimeout(() => scrollToTarget('smooth'), 50); // Ensure it sticks
        } else {
          scrollToTarget();
        }
      }
    }
  }, [selected, options, onSpin, isHorizontal, ITEM_SIZE]);

  // Vertical Scroll Handler (Desktop)
  const handleScroll = () => {
    if (isHorizontal || !containerRef.current) return;
    
    // Vertical logic relies on native scroll events
    const scrollT = containerRef.current.scrollTop;
    let centerIndex = Math.round(scrollT / ITEM_SIZE);
    centerIndex = Math.max(0, Math.min(centerIndex, options.length - 1));

    if (centerIndex >= 0 && centerIndex < options.length) {
      const newId = options[centerIndex].id;
      if (newId !== selected) {
        if (navigator.vibrate) navigator.vibrate(5);
        onChange(newId);
      }
    }
  };

  // Manual Navigation (Arrows or Swipe)
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

        {/* NAVIGATION BUTTONS (Horizontal Only) - Enhanced Glass Effect */}
        {isHorizontal && (
            <>
                {/* Left Button */}
                <button 
                    onClick={() => handleNav('prev')}
                    className={`absolute left-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:bg-white/20 hover:scale-105`}
                    aria-label="Previous"
                >
                    <svg className={`w-5 h-5 ${arrowColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>

                {/* Right Button */}
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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
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
              onClick={() => {
                   // Click to select
                   onChange(opt.id);
              }}
              className={`
                flex items-center justify-center transition-all duration-300 flex-shrink-0
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
