
import React, { useState, useEffect } from 'react';
import { Recommendation, DecoderSelection } from '../types';

interface ResultsProps {
  recommendations: Recommendation[];
  selection: DecoderSelection | null;
  onReset: () => void;
  serverIdentifier?: string;
}

type SortOption = 'match' | 'imdb' | 'rt' | 'year' | 'length';

export const Results: React.FC<ResultsProps> = ({ recommendations, selection, onReset, serverIdentifier }) => {
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [selectedPick, setSelectedPick] = useState<Recommendation | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const topPick = recommendations[0];
  let others = recommendations.slice(1);

  // Detect Mobile for Deep Linking
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
        setIsMobile(true);
      } else {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
  }, []);

  // Sorting Logic
  others = [...others].sort((a, b) => {
    switch (sortBy) {
      case 'year':
        return (b.item.year || 0) - (a.item.year || 0);
      case 'length':
        return (b.item.duration || 0) - (a.item.duration || 0);
      case 'imdb':
        const imdbA = parseFloat(a.imdbRating || '0');
        const imdbB = parseFloat(b.imdbRating || '0');
        return imdbB - imdbA;
      case 'rt':
        const rtA = parseInt(a.rottenTomatoesScore?.replace('%', '') || '0');
        const rtB = parseInt(b.rottenTomatoesScore?.replace('%', '') || '0');
        return rtB - rtA;
      case 'match':
      default:
        return b.score - a.score;
    }
  });

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const getFormatLabel = (type?: string) => {
    if (type === 'movie') return 'Movies';
    if (type === 'show') return 'TV Shows';
    return 'Movies & Shows';
  };

  const getHistoryLabel = (hist?: string) => {
    if (hist === 'unwatched') return 'Unwatched';
    if (hist === 'favorite') return 'Rewatch';
    return 'All';
  };
  
  const getVibeLabel = (v?: string) => {
    if (!v || v === 'any') return 'Open to Anything';
    return v;
  }

  const getSearchUrl = (site: 'imdb' | 'rt', title: string) => {
    const query = encodeURIComponent(title);
    if (site === 'imdb') return `https://www.imdb.com/find?q=${query}`;
    if (site === 'rt') return `https://www.rottentomatoes.com/search?search=${query}`;
    return '#';
  };

  // Generate Web Link (Universal)
  const getPlexWebLink = (key: string) => {
    if (!serverIdentifier) return undefined;
    const encodedKey = encodeURIComponent(key);
    return `https://app.plex.tv/desktop/#!/server/${serverIdentifier}/details?key=${encodedKey}`;
  };

  // Generate App Link (Mobile Scheme)
  const getPlexAppLink = (key: string) => {
    if (!serverIdentifier) return undefined;
    // plex://server/{machineIdentifier}/details?key={key}
    const encodedKey = encodeURIComponent(key);
    return `plex://server/${serverIdentifier}/details?key=${encodedKey}`;
  };

  if (!topPick) {
    return (
      <div className="text-center p-10 mt-20">
        <h2 className="text-2xl text-white mb-4">No matches found.</h2>
        <p className="text-gray-400 mb-6">Try broadening your search or choosing a different category.</p>
        <button onClick={onReset} className="text-plex-orange underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-0 md:px-6 pt-0 pb-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
      
      {/* Back Button */}
      <div className="w-full mb-1 flex justify-start">
        <button onClick={onReset} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors text-xs md:text-sm font-medium py-1 px-1 -ml-1">
          ← Start a New Search
        </button>
      </div>

      {/* Context Pills */}
      <div className="flex flex-col items-center justify-center mb-4 md:mb-6 space-y-2 w-full">
         <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-500">Picked For You</div>
         <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <span className="font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 md:px-4 py-1 rounded-full text-xs md:text-sm whitespace-nowrap">
              {getFormatLabel(selection?.type)}
            </span>
            <span className="text-gray-600 hidden md:inline">•</span>
            <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 md:px-4 py-1 rounded-full text-xs md:text-sm whitespace-nowrap">
              {getHistoryLabel(selection?.history)}
            </span>
            <span className="text-gray-600 hidden md:inline">•</span>
            <span className="font-bold text-orange-400 bg-orange-950/40 border border-orange-500/20 px-2 md:px-4 py-1 rounded-full text-xs md:text-sm whitespace-nowrap">
              {getVibeLabel(selection?.vibe)}
            </span>
         </div>
      </div>

      {/* Top Pick Header */}
      <div className="flex justify-end mb-2 px-2 md:px-0">
        <div className="text-right">
           <span className="text-plex-orange uppercase tracking-widest text-xs md:text-sm font-bold block">Top Match ({Math.round(topPick.score)}% Match)</span>
        </div>
      </div>

      {/* MAIN FEATURE CARD */}
      <div className="grid grid-cols-12 gap-3 md:gap-8 mb-8 bg-plex-slate/20 p-4 md:p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-plex-orange/5 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

        {/* 1. IMAGE BLOCK (Left) */}
        <div className="col-span-4 md:col-span-4 lg:col-span-3 md:row-span-2 relative z-10">
          {serverIdentifier ? (
             <a 
               href={isMobile ? getPlexAppLink(topPick.item.key) : getPlexWebLink(topPick.item.key)} 
               target={isMobile ? undefined : "_blank"}
               rel={isMobile ? undefined : "noopener noreferrer"}
               className="block group relative h-full"
             >
                <div className="aspect-[2/3] w-full relative rounded-xl overflow-hidden shadow-2xl bg-gray-900 ring-1 ring-white/10 group-hover:ring-plex-orange transition-all">
                    {topPick.item.thumb ? (
                    <img src={topPick.item.thumb} alt={topPick.item.title} className="w-full h-full object-cover" />
                    ) : (
                    <div className="w-full h-full bg-plex-slate flex items-center justify-center text-gray-600 text-xs text-center p-1">No Poster</div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-plex-orange flex items-center justify-center text-black shadow-lg">
                            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>
             </a>
          ) : (
            <div className="aspect-[2/3] w-full relative rounded-xl overflow-hidden shadow-2xl bg-gray-900">
                {topPick.item.thumb ? (
                  <img src={topPick.item.thumb} alt={topPick.item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-plex-slate flex items-center justify-center text-gray-600">No Poster</div>
                )}
            </div>
          )}
        </div>
        
        {/* 2. HEADER + REASON BLOCK (Right) */}
        <div className="col-span-8 md:col-span-8 lg:col-span-9 flex flex-col justify-start relative z-10">
          
          {/* Compact Flow Header: Title -> Year -> Type -> Duration -> Ratings */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
             {/* Title & Year */}
             <div className="inline-block">
                {serverIdentifier ? (
                    <a href={getPlexWebLink(topPick.item.key)} target="_blank" rel="noopener noreferrer" className="hover:text-plex-orange transition-colors">
                        <h1 className="text-lg md:text-5xl font-display font-bold text-white leading-tight inline">
                            {topPick.item.title}
                        </h1>
                        <span className="text-gray-500 font-light text-base md:text-3xl ml-2">({topPick.item.year})</span>
                    </a>
                ) : (
                    <>
                        <h1 className="text-lg md:text-5xl font-display font-bold text-white leading-tight inline">
                            {topPick.item.title}
                        </h1>
                        <span className="text-gray-500 font-light text-base md:text-3xl ml-2">({topPick.item.year})</span>
                    </>
                )}
             </div>

             {/* Metadata Flow */}
             <span className="w-1 h-1 bg-gray-600 rounded-full self-center hidden md:inline-block"></span>
             
             <span className="text-xs md:text-sm font-bold text-gray-300 uppercase tracking-wider">
               {topPick.item.type === 'show' ? 'TV Series' : 'Movie'}
             </span>
             
             {topPick.item.duration && (
                 <>
                    <span className="w-1 h-1 bg-gray-600 rounded-full self-center"></span>
                    <span className="text-xs md:text-sm font-medium text-gray-400">{formatDuration(topPick.item.duration)}</span>
                 </>
             )}

             {/* Ratings */}
             <div className="flex items-center gap-2 ml-1">
                 {topPick.imdbRating && (
                    <a href={getSearchUrl('imdb', topPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 bg-[#f5c518] text-black rounded font-bold text-[10px] md:text-xs flex items-center gap-1 hover:brightness-110">
                      IMDb {topPick.imdbRating}
                    </a>
                 )}
                 {topPick.rottenTomatoesScore && (
                    <a href={getSearchUrl('rt', topPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 bg-[#fa320a] text-white rounded font-bold text-[10px] md:text-xs flex items-center gap-1 hover:brightness-110">
                      RT {topPick.rottenTomatoesScore}
                    </a>
                 )}
             </div>
          </div>
          
          {/* Genre Tags (Desktop Only - Optional cleanup) */}
          <div className="hidden md:flex gap-1 mb-4">
             {topPick.item.genre?.slice(0, 3).map(g => (
                <span key={g} className="text-plex-orange text-xs font-medium uppercase tracking-wider px-1 border border-plex-orange/20 rounded">
                  {g}
                </span>
             ))}
          </div>

          {/* AI Reason - Moved Next to Poster on Mobile */}
          <div className="bg-plex-orange/10 border-l-2 md:border-l-4 border-plex-orange p-2 md:p-4 rounded-r-lg">
            <p className="text-xs md:text-lg text-white italic font-light line-clamp-4 md:line-clamp-none leading-snug">
                "{topPick.reason}"
            </p>
          </div>
        </div>

        {/* 3. SYNOPSIS BLOCK (Bottom / Flow) */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 relative z-10 mt-1 md:mt-0">
          <p className="text-gray-400 leading-relaxed text-xs md:text-base">
            {topPick.item.summary}
          </p>
        </div>

      </div>

      {/* Alternatives List */}
      {others.length > 0 && (
        <div className="border-t border-white/10 pt-5 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-0 md:px-0">
            <h3 className="text-xl font-display font-bold text-gray-500 uppercase tracking-wider mb-4 md:mb-0">More Picks</h3>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-black border border-white/20 text-white text-sm rounded px-3 py-1 focus:border-plex-orange outline-none"
              >
                <option value="match">Match %</option>
                <option value="imdb">IMDb Rating</option>
                <option value="rt">Rotten Tomatoes</option>
                <option value="year">Release Year</option>
                <option value="length">Length</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {others.map((rec) => (
              <div 
                key={rec.item.ratingKey} 
                className="flex gap-3 md:gap-4 p-2 md:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group relative cursor-pointer"
              >
                <div className="absolute inset-0 z-0" onClick={() => setSelectedPick(rec)}></div>
                <div className="w-20 aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative pointer-events-none">
                  {rec.item.thumb && <img src={rec.item.thumb} alt={rec.item.title} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                       <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0 pointer-events-none">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-base md:text-lg text-white group-hover:text-plex-orange transition-colors truncate pr-2">{rec.item.title}</h4>
                    <span className="text-[10px] md:text-xs text-gray-500 font-mono whitespace-nowrap mt-1">{rec.item.year}</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-3 text-sm mb-2 mt-1 flex-wrap pointer-events-auto relative z-10">
                     <span className="text-plex-orange font-bold whitespace-nowrap text-[10px] md:text-xs">{Math.round(rec.score)}% Match</span>
                     {rec.imdbRating && (
                        <a href={getSearchUrl('imdb', rec.item.title)} target="_blank" rel="noopener noreferrer" className="text-[#f5c518] font-bold text-[10px] md:text-xs whitespace-nowrap hover:underline">
                          IMDb {rec.imdbRating}
                        </a>
                     )}
                     {rec.rottenTomatoesScore && (
                       <a href={getSearchUrl('rt', rec.item.title)} target="_blank" rel="noopener noreferrer" className="text-[#fa320a] font-bold text-[10px] md:text-xs whitespace-nowrap hover:underline">
                         RT {rec.rottenTomatoesScore}
                       </a>
                     )}
                     <span className="text-gray-500 text-[10px] md:text-xs whitespace-nowrap">• {formatDuration(rec.item.duration)}</span>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm line-clamp-2 italic">"{rec.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Card */}
      <div className="mt-6 border border-white/10 bg-plex-slate/40 backdrop-blur-md rounded-xl p-6 md:p-8 text-center relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-plex-orange/5 to-transparent opacity-100"></div>
         <div className="absolute inset-0 bg-plex-orange/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         <h3 className="text-xl font-display font-bold text-white mb-2 relative z-10">Did you find this awesome?</h3>
         <p className="text-gray-400 mb-6 relative z-10 text-sm md:text-base">If PlexPicker helped you decide what to watch tonight, consider supporting the developer!</p>
         
         <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 relative z-10 w-full max-w-sm md:max-w-none mx-auto">
            <a href="https://paypal.me/matthewfugel/5" target="_blank" rel="noopener noreferrer" className="px-4 py-3 md:px-6 bg-cyan-500/10 text-cyan-400 font-bold rounded-full border border-cyan-500/30 hover:bg-cyan-500 hover:text-black hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/20 text-xs md:text-sm flex items-center justify-center"><span className="uppercase tracking-wide">🥤 Soda ($5)</span></a>
            <a href="https://paypal.me/matthewfugel/10" target="_blank" rel="noopener noreferrer" className="px-4 py-3 md:px-6 bg-emerald-500/10 text-emerald-400 font-bold rounded-full border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20 text-xs md:text-sm flex items-center justify-center"><span className="uppercase tracking-wide">🍿 Snacks ($10)</span></a>
            <a href="https://paypal.me/matthewfugel/20" target="_blank" rel="noopener noreferrer" className="px-4 py-3 md:px-6 bg-orange-500/10 text-orange-400 font-bold rounded-full border border-orange-500/30 hover:bg-orange-500 hover:text-black hover:scale-105 transition-all shadow-lg hover:shadow-orange-500/20 text-xs md:text-sm flex items-center justify-center"><span className="uppercase tracking-wide">🍕 Pizza ($20)</span></a>
            <a href="https://paypal.me/matthewfugel" target="_blank" rel="noopener noreferrer" className="px-4 py-3 md:px-6 bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-white font-bold rounded-full border-none hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/30 text-xs md:text-sm flex items-center justify-center"><span className="uppercase tracking-wide">🎁 Surprise</span></a>
         </div>
      </div>

      {/* Details Modal */}
      {selectedPick && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedPick(null)}></div>
           <div className="relative z-10 bg-[#1F2326] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row overflow-hidden">
               <button onClick={() => setSelectedPick(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors">✕</button>
               <div className="w-full md:w-2/5 relative h-64 md:h-auto">
                 {selectedPick.item.thumb ? <img src={selectedPick.item.thumb} alt={selectedPick.item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">No Poster</div>}
               </div>
               <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
                  <div className="mb-1">
                    <h2 className="text-3xl font-display font-bold text-white leading-tight">{selectedPick.item.title}</h2>
                    <div className="text-gray-400 text-sm mt-1">{selectedPick.item.year} • {selectedPick.item.type === 'show' ? 'TV Series' : 'Movie'} • {formatDuration(selectedPick.item.duration)}</div>
                  </div>
                  <div className="flex gap-3 my-4">
                     {selectedPick.imdbRating && <a href={getSearchUrl('imdb', selectedPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-[#f5c518] text-black rounded font-bold text-xs hover:brightness-110">IMDb {selectedPick.imdbRating}</a>}
                     {selectedPick.rottenTomatoesScore && <a href={getSearchUrl('rt', selectedPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-[#fa320a] text-white rounded font-bold text-xs hover:brightness-110">RT {selectedPick.rottenTomatoesScore}</a>}
                     <span className="px-2 py-1 bg-plex-orange/20 text-plex-orange border border-plex-orange/20 rounded font-bold text-xs">{Math.round(selectedPick.score)}% Match</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                     <p className="text-plex-orange italic mb-4 text-sm font-medium">"{selectedPick.reason}"</p>
                     <p className="text-gray-300 text-sm leading-relaxed mb-6">{selectedPick.item.summary}</p>
                     <div className="flex flex-wrap gap-2 mb-6">
                        {selectedPick.item.genre?.map(g => (<span key={g} className="text-[10px] uppercase tracking-wider bg-white/5 px-2 py-1 rounded text-gray-400">{g}</span>))}
                     </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
                      {serverIdentifier ? (
                        <>
                          <a 
                            href={isMobile ? getPlexAppLink(selectedPick.item.key) : getPlexWebLink(selectedPick.item.key)} 
                            target={isMobile ? undefined : "_blank"} 
                            rel={isMobile ? undefined : "noopener noreferrer"} 
                            className="w-full block text-center bg-plex-orange hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors uppercase tracking-widest text-sm"
                          >
                            Watch on Plex
                          </a>
                          {isMobile && (
                            <a 
                              href={getPlexWebLink(selectedPick.item.key)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-center text-gray-500 text-xs hover:text-white"
                            >
                              Or open in Web Browser
                            </a>
                          )}
                        </>
                      ) : (<div className="text-center text-gray-500 text-xs italic">(Connect to Plex to watch)</div>)}
                  </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
