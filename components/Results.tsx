
import React, { useState } from 'react';
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

  const topPick = recommendations[0];
  let others = recommendations.slice(1);

  // Sorting Logic for Alternatives
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

  // Helpers
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

  // Generate Deep Link
  // https://app.plex.tv/desktop/#!/server/{serverID}/details?key={key}
  const getPlexLink = (key: string) => {
    if (!serverIdentifier) return undefined;
    const encodedKey = encodeURIComponent(key);
    return `https://app.plex.tv/desktop/#!/server/${serverIdentifier}/details?key=${encodedKey}`;
  };

  if (!topPick) {
    return (
      <div className="text-center p-10 mt-20">
        <h2 className="text-2xl text-white mb-4">No matches found.</h2>
        <p className="text-gray-400 mb-6">Try broadening your search or choosing a different category.</p>
        <div className="flex justify-center gap-2 mb-8 text-gray-400">
           <span>{getFormatLabel(selection?.type)}</span>
           <span>•</span>
           <span>{getHistoryLabel(selection?.history)}</span>
           <span>•</span>
           <span className="text-plex-orange">"{getVibeLabel(selection?.vibe)}"</span>
        </div>
        <button onClick={onReset} className="text-plex-orange underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
      
      {/* Search Context Bar */}
      <div className="flex flex-col items-center justify-center mb-10 space-y-2">
         <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Picked For You</div>
         <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm md:text-lg">
            {/* Cyan for Format */}
            <span className="font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-4 py-1 rounded-full">
              {getFormatLabel(selection?.type)}
            </span>
            <span className="text-gray-600">•</span>
            
            {/* Emerald for History */}
            <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-4 py-1 rounded-full">
              {getHistoryLabel(selection?.history)}
            </span>
            <span className="text-gray-600">•</span>
            
            {/* Orange for Vibe */}
            <span className="font-bold text-orange-400 bg-orange-950/40 border border-orange-500/20 px-4 py-1 rounded-full">
              {getVibeLabel(selection?.vibe)}
            </span>
         </div>
      </div>

      {/* Top Pick Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <button onClick={onReset} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors order-2 md:order-1">
          ← Back to Decoder
        </button>
        
        <div className="order-1 md:order-2 text-right">
           <span className="text-plex-orange uppercase tracking-widest text-sm font-bold block">Top Match ({topPick.score}% Match)</span>
           <span className="text-gray-500 text-xs mt-1 block">Select your pick to start watching</span>
        </div>
      </div>

      {/* Main Feature */}
      <div className="grid md:grid-cols-12 gap-8 mb-16 bg-plex-slate/20 p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        {/* Background Blur Effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-plex-orange/5 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

        <div className="md:col-span-4 lg:col-span-3 relative z-10">
          {/* Card Container with Deep Link */}
          {serverIdentifier ? (
             <a 
               href={getPlexLink(topPick.item.key)} 
               target="_blank" 
               rel="noopener noreferrer"
               className="block group relative"
             >
                <div className="aspect-[2/3] w-full relative rounded-xl overflow-hidden shadow-2xl bg-gray-900 ring-1 ring-white/10 group-hover:ring-plex-orange transition-all">
                    {topPick.item.thumb ? (
                    <img src={topPick.item.thumb} alt={topPick.item.title} className="w-full h-full object-cover" />
                    ) : (
                    <div className="w-full h-full bg-plex-slate flex items-center justify-center text-gray-600">No Poster</div>
                    )}
                    
                    {/* Hover Overlay - Watch on Plex */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-plex-orange flex items-center justify-center text-black shadow-lg transform group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <span className="text-white font-bold uppercase tracking-wider text-xs">Watch on Plex</span>
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
        
        <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-center relative z-10">
          <div className="flex items-baseline gap-4 mb-2">
            {serverIdentifier ? (
                <a href={getPlexLink(topPick.item.key)} target="_blank" rel="noopener noreferrer" className="hover:text-plex-orange transition-colors">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">{topPick.item.title}</h1>
                </a>
            ) : (
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">{topPick.item.title}</h1>
            )}
            <span className="text-xl text-gray-500 font-light">{topPick.item.year}</span>
          </div>
          
          {/* Ratings & Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
             {topPick.imdbRating && (
               <span className="px-2 py-1 bg-[#f5c518] text-black rounded font-bold text-xs flex items-center gap-1" title="IMDb Rating">
                 IMDb {topPick.imdbRating}
               </span>
             )}
             {topPick.rottenTomatoesScore && (
               <span className="px-2 py-1 bg-[#fa320a] text-white rounded font-bold text-xs flex items-center gap-1" title="Rotten Tomatoes">
                 {topPick.rottenTomatoesScore}
               </span>
             )}
            <span className="w-1 h-1 bg-gray-600 rounded-full mx-1"></span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-300">
              {topPick.item.type === 'show' ? 'TV Series' : 'Movie'}
            </span>
             <span className="w-1 h-1 bg-gray-600 rounded-full mx-1"></span>
             {topPick.item.duration ? (
                <span className="text-xs font-medium text-gray-400">{formatDuration(topPick.item.duration)}</span>
             ) : (
                 <span className="text-xs font-medium text-gray-600">-- min</span>
             )}
             <span className="w-1 h-1 bg-gray-600 rounded-full mx-1"></span>
            {topPick.item.genre?.slice(0, 3).map(g => (
              <span key={g} className="text-plex-orange text-xs font-medium uppercase tracking-wider">
                {g}
              </span>
            ))}
          </div>

          <div className="bg-plex-orange/10 border-l-4 border-plex-orange p-4 mb-6 rounded-r-lg">
            <p className="text-lg text-white italic font-light">"{topPick.reason}"</p>
          </div>
          
          <p className="text-gray-400 leading-relaxed max-w-2xl text-sm md:text-base">
            {topPick.item.summary}
          </p>
        </div>
      </div>

      {/* Alternatives with Sorting */}
      {others.length > 0 && (
        <div className="border-t border-white/10 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold text-gray-500 uppercase tracking-wider mb-4 md:mb-0">More Picks</h3>
            
            {/* Sort Menu */}
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
              <div key={rec.item.ratingKey} className="flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group relative">
                {/* Deep Link Wrapper */}
                {serverIdentifier && (
                    <a 
                      href={getPlexLink(rec.item.key)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute inset-0 z-20"
                      aria-label={`Watch ${rec.item.title} on Plex`}
                    ></a>
                )}
                
                <div className="w-20 aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                  {rec.item.thumb && <img src={rec.item.thumb} alt={rec.item.title} className="w-full h-full object-cover" />}
                  {/* Mini Rating on Thumbnail */}
                  {rec.imdbRating && (
                     <div className="absolute bottom-0 right-0 bg-[#f5c518] text-black text-[10px] font-bold px-1 z-10">
                        {rec.imdbRating}
                     </div>
                  )}
                  {/* Play Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                       <svg className="w-8 h-8 text-plex-orange" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-white group-hover:text-plex-orange transition-colors truncate pr-2">{rec.item.title}</h4>
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">{rec.item.year}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm mb-2 mt-1">
                     <span className="text-plex-orange font-bold whitespace-nowrap">{rec.score}% Match</span>
                     {rec.imdbRating && (
                        <span className="text-[#f5c518] font-bold text-xs whitespace-nowrap">IMDb {rec.imdbRating}</span>
                     )}
                     <span className="text-gray-500 text-xs whitespace-nowrap">• {formatDuration(rec.item.duration)}</span>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2 italic">"{rec.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support / Donate Card */}
      <div className="mt-20 border border-white/5 bg-gradient-to-r from-plex-orange/5 to-transparent rounded-xl p-8 text-center relative overflow-hidden group">
         <div className="absolute inset-0 bg-plex-orange/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         <h3 className="text-xl font-display font-bold text-white mb-2 relative z-10">Did you find this awesome?</h3>
         <p className="text-gray-400 mb-6 relative z-10">If PlexPicker helped you decide what to watch tonight, please support MY next movie night!</p>
         
         <div className="flex flex-wrap justify-center gap-3 relative z-10">
            {/* Cyan - Soda */}
            <a 
              href="https://paypal.me/matthewfugel/5" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-cyan-500/10 text-cyan-400 font-bold rounded-full border border-cyan-500/30 hover:bg-cyan-500 hover:text-black hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/20"
            >
              <span className="uppercase tracking-wide">🥤 Soda ($5)</span>
            </a>

            {/* Emerald - Snacks */}
            <a 
              href="https://paypal.me/matthewfugel/10" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-500/10 text-emerald-400 font-bold rounded-full border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:scale-105 transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              <span className="uppercase tracking-wide">🍿 Snacks ($10)</span>
            </a>

            {/* Orange - Pizza */}
            <a 
              href="https://paypal.me/matthewfugel/20" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-orange-500/10 text-orange-400 font-bold rounded-full border border-orange-500/30 hover:bg-orange-500 hover:text-black hover:scale-105 transition-all shadow-lg hover:shadow-orange-500/20"
            >
              <span className="uppercase tracking-wide">🍕 Pizza ($20)</span>
            </a>
            
            {/* Gradient - Surprise */}
            <a 
              href="https://paypal.me/matthewfugel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-white font-bold rounded-full border-none hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/30"
            >
              <span className="uppercase tracking-wide">🎁 Surprise ✨</span>
            </a>
         </div>
      </div>
    </div>
  );
};
