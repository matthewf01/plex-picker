
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

  useEffect(() => {
    // Detect Mobile/Tablet Devices for layout adjustments
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      // Regex covers iOS and Android devices
      if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)) {
        setIsMobile(true);
      }
    };
    checkMobile();
  }, []);

  const topPick = recommendations[0];
  let others = recommendations.slice(1);

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

  // Generate Deep Link
  const getPlexLink = (key: string) => {
    if (!serverIdentifier) return undefined;
    const encodedKey = encodeURIComponent(key);
    
    // We utilize the universal app.plex.tv link.
    // On mobile devices with the Plex app installed, this URL is intercepted (Universal Links / App Links)
    // and opens the specific content directly in the app.
    // The previous 'plex://' custom scheme is unreliable for deep navigation.
    return `https://app.plex.tv/desktop/#!/server/${serverIdentifier}/details?key=${encodedKey}`;
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
    <div className="w-full max-w-6xl mx-auto px-0 md:px-6 pt-0 pb-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
      
      {/* Back Button */}
      <div className="w-full mb-1 flex justify-start px-0 md:px-0">
        <button onClick={onReset} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors text-xs md:text-sm font-medium py-1 px-1 -ml-1">
          ← Start a New Search
        </button>
      </div>

      {/* Context Pills */}
      <div className="flex flex-col items-center justify-center mb-4 md:mb-8 space-y-2 w-full px-0 md:px-0">
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
      <div className="flex justify-end mb-2 px-0 md:px-0">
        <div className="text-right">
           <span className="text-plex-orange uppercase tracking-widest text-xs md:text-sm font-bold block">Top Match ({Math.round(topPick.score)}% Match)</span>
        </div>
      </div>

      {/* MAIN FEATURE CARD */}
      <div className="bg-plex-slate/20 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-plex-orange/5 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

        {/* --- MOBILE LAYOUT (Compact Side-by-Side) --- */}
        <div className="md:hidden p-4 relative z-10 flex flex-col gap-4">
             <div className="flex gap-4 items-start">
                {/* Poster - Fixed width, approx 1/3 screen */}
                <div className="w-32 flex-shrink-0">
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 relative">
                        {serverIdentifier ? (
                            <a href={getPlexLink(topPick.item.key)} className="block w-full h-full">
                                {topPick.item.thumb ? (
                                    <img src={topPick.item.thumb} alt={topPick.item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-plex-slate flex items-center justify-center text-gray-500 text-[10px]">No Poster</div>
                                )}
                            </a>
                        ) : (
                             <div className="w-full h-full">
                                {topPick.item.thumb ? (
                                    <img src={topPick.item.thumb} alt={topPick.item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-plex-slate flex items-center justify-center text-gray-500 text-[10px]">No Poster</div>
                                )}
                             </div>
                        )}
                    </div>
                </div>

                {/* Metadata Column */}
                <div className="flex-1 min-w-0 flex flex-col justify-start pt-1">
                    <h1 className="text-2xl font-display font-bold text-white leading-tight mb-2">
                         {serverIdentifier ? (
                            <a href={getPlexLink(topPick.item.key)} className="hover:text-plex-orange">
                                {topPick.item.title}
                            </a>
                         ) : (
                             topPick.item.title
                         )}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 mb-3">
                         <span>{topPick.item.year}</span>
                         <span>•</span>
                         <span className="uppercase font-bold">{topPick.item.type === 'show' ? 'TV' : 'Movie'}</span>
                         {topPick.item.duration && (
                            <>
                                <span>•</span>
                                <span>{formatDuration(topPick.item.duration)}</span>
                            </>
                         )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {topPick.imdbRating && (
                            <a href={getSearchUrl('imdb', topPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-[#f5c518] text-black rounded font-bold text-[10px] hover:brightness-110">
                              IMDb {topPick.imdbRating}
                            </a>
                        )}
                        {topPick.rottenTomatoesScore && (
                            <a href={getSearchUrl('rt', topPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-[#fa320a] text-white rounded font-bold text-[10px] hover:brightness-110">
                              RT {topPick.rottenTomatoesScore}
                            </a>
                        )}
                    </div>
                </div>
             </div>

             {/* AI Reason */}
             <div className="bg-plex-orange/10 border-l-4 border-plex-orange p-4 rounded-r-xl">
                 <h3 className="text-plex-orange text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                    Why match?
                 </h3>
                 <p className="text-white font-serif italic leading-relaxed text-sm">
                    "{topPick.reason}"
                 </p>
             </div>

             {/* Action Button */}
             {serverIdentifier && (
                <a 
                    href={getPlexLink(topPick.item.key)} 
                    className="w-full block text-center bg-plex-orange text-black font-bold py-3 rounded-xl shadow-lg shadow-plex-orange/20 uppercase tracking-widest text-sm"
                >
                    {isMobile ? 'Open in Plex App' : 'Watch on Plex'}
                </a>
             )}
             
             {/* Synopsis */}
             <p className="text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                 {topPick.item.summary}
             </p>
        </div>

        {/* --- DESKTOP LAYOUT (Original) --- */}
        <div className="hidden md:grid grid-cols-12 gap-10 relative z-10 p-0 md:p-4">
            {/* LEFT COLUMN: Title & Poster */}
            <div className="col-span-4 flex flex-col gap-4">
              {/* Title Area */}
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                  {serverIdentifier ? (
                     <a href={getPlexLink(topPick.item.key)} target="_blank" rel="noopener noreferrer" className="hover:text-plex-orange transition-colors">
                       {topPick.item.title}
                     </a>
                  ) : (
                     topPick.item.title
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-gray-400 text-sm md:text-base">
                   <span>{topPick.item.year}</span>
                   <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                   <span className="uppercase tracking-wider text-xs font-bold">{topPick.item.type === 'show' ? 'TV Series' : 'Movie'}</span>
                   {topPick.item.duration && (
                      <>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span>{formatDuration(topPick.item.duration)}</span>
                      </>
                   )}
                </div>
              </div>

              {/* Poster */}
              <div className="w-full max-w-[300px] md:max-w-none mx-auto md:mx-0 shadow-2xl rounded-xl overflow-hidden bg-gray-900 ring-1 ring-white/10 relative group">
                  {serverIdentifier ? (
                    <a href={getPlexLink(topPick.item.key)} target="_blank" rel="noopener noreferrer" className="block relative aspect-[2/3]">
                        {topPick.item.thumb ? (
                          <img src={topPick.item.thumb} alt={topPick.item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-plex-slate flex items-center justify-center text-gray-600 text-xs">No Poster</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-plex-orange text-black font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">Watch Now</span>
                        </div>
                    </a>
                  ) : (
                    <div className="aspect-[2/3] relative">
                        {topPick.item.thumb ? (
                          <img src={topPick.item.thumb} alt={topPick.item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-plex-slate flex items-center justify-center text-gray-600 text-xs">No Poster</div>
                        )}
                    </div>
                  )}
              </div>
            </div>

            {/* RIGHT COLUMN: AI Analysis & Info */}
            <div className="col-span-8 flex flex-col relative z-10 pt-4">
               
               {/* AI Reason - Main Focus */}
               <div className="flex-1 flex flex-col justify-start">
                  <div className="bg-plex-orange/10 border-l-4 border-plex-orange p-6 md:p-8 rounded-r-2xl mb-6 backdrop-blur-sm">
                     <h3 className="text-plex-orange text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                        Why you should watch this
                     </h3>
                     <p className="text-xl md:text-3xl text-white font-serif italic leading-relaxed md:leading-normal">
                        "{topPick.reason}"
                     </p>
                  </div>
               </div>

               {/* Metadata Badges */}
               <div className="flex flex-wrap items-center gap-3 mb-6">
                    {topPick.imdbRating && (
                        <a href={getSearchUrl('imdb', topPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#f5c518] text-black rounded-md font-bold text-sm flex items-center gap-1 hover:brightness-110">
                          IMDb {topPick.imdbRating}
                        </a>
                    )}
                    {topPick.rottenTomatoesScore && (
                        <a href={getSearchUrl('rt', topPick.item.title)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#fa320a] text-white rounded-md font-bold text-sm flex items-center gap-1 hover:brightness-110">
                          RT {topPick.rottenTomatoesScore}
                        </a>
                    )}
                    {topPick.item.genre?.map(g => (
                        <span key={g} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-gray-300 text-xs uppercase tracking-wider font-bold">
                            {g}
                        </span>
                    ))}
               </div>

               {/* Synopsis */}
               <div className="bg-black/20 rounded-xl p-5 md:p-6 border border-white/5">
                  <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Synopsis</h4>
                  <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                    {topPick.item.summary}
                  </p>
               </div>
            </div>
        </div>

      </div>

      {/* Alternatives List */}
      {others.length > 0 && (
        <div className="border-t border-white/10 pt-8 px-0 md:px-0">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
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

          <div className="grid grid-cols-1 gap-4">
            {others.map((rec) => (
              <div 
                key={rec.item.ratingKey} 
                className="flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group relative cursor-pointer border border-white/5 hover:border-white/10"
              >
                <div className="absolute inset-0 z-0" onClick={() => setSelectedPick(rec)}></div>
                <div className="w-24 aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative pointer-events-none shadow-lg">
                  {rec.item.thumb && <img src={rec.item.thumb} alt={rec.item.title} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                       <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0 pointer-events-none flex flex-col">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-white group-hover:text-plex-orange transition-colors pr-2 leading-tight">{rec.item.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                     <span>{rec.item.year}</span>
                     <span>•</span>
                     <span>{formatDuration(rec.item.duration)}</span>
                     {rec.imdbRating && <span className="text-[#f5c518] font-bold ml-1">IMDb {rec.imdbRating}</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-plex-orange font-bold text-xs bg-plex-orange/10 px-2 py-0.5 rounded border border-plex-orange/20">{Math.round(rec.score)}% Match</span>
                  </div>
                  <p className="text-gray-300 text-sm italic mt-2">"{rec.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Card */}
      <div className="mt-8 mx-0 md:mx-0 border border-white/10 bg-plex-slate/40 backdrop-blur-md rounded-xl p-6 md:p-8 text-center relative overflow-hidden group">
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
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 pt-24 md:p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedPick(null)}></div>
           {/* Modal Container: On mobile, overflow-y-auto allows full card scrolling. On desktop, we clip to support split-pane scrolling. */}
           <div className="relative z-10 bg-[#1F2326] w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
               <button onClick={() => setSelectedPick(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors">✕</button>
               <div className="w-full md:w-2/5 relative h-64 md:h-auto flex-shrink-0">
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
                  {/* Text Container: On mobile, let it grow naturally (no scroll). On desktop, constrain and scroll internally. */}
                  <div className="md:flex-1 md:overflow-y-auto md:pr-2 custom-scrollbar">
                     <p className="text-plex-orange italic mb-4 text-sm font-medium">"{selectedPick.reason}"</p>
                     <p className="text-gray-300 text-sm leading-relaxed mb-6">{selectedPick.item.summary}</p>
                     <div className="flex flex-wrap gap-2 mb-6">
                        {selectedPick.item.genre?.map(g => (<span key={g} className="text-[10px] uppercase tracking-wider bg-white/5 px-2 py-1 rounded text-gray-400">{g}</span>))}
                     </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2 flex-shrink-0">
                      {serverIdentifier ? (
                        <>
                          <a 
                            href={getPlexLink(selectedPick.item.key)} 
                            className="w-full block text-center bg-plex-orange hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors uppercase tracking-widest text-sm"
                          >
                            {isMobile ? 'Open in Plex App' : 'Watch on Plex'}
                          </a>
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
