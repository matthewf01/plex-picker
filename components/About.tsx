
import React from 'react';

interface AboutProps {
  onClose: () => void;
}

export const About: React.FC<AboutProps> = ({ onClose }) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-10 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-white">About PlexPicker</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">✕ Close</button>
      </div>
      
      <div className="space-y-6 text-gray-300 leading-relaxed font-light">
        <p className="text-lg">
          PlexPicker is a cinematic decoder-ring interface designed to cure choice paralysis. 
          By connecting directly to your Plex server, it analyzes your library and uses Google's Gemini AI 
          to recommend movies or shows based on your current mood and viewing history.
        </p>
        
        <div className="bg-plex-slate/30 p-8 rounded-2xl border border-white/5 mt-8 shadow-xl">
          <h3 className="text-plex-orange font-bold uppercase tracking-widest text-xs mb-6 text-center sm:text-left">Developer</h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
            <img 
              src="https://r3o8l3emxrod5sof.public.blob.vercel-storage.com/images/matthew.webp" 
              alt="Matthew Fugel" 
              className="w-32 h-32 rounded-full object-cover border-2 border-white/10 shadow-lg bg-black/50"
            />
            <p className="text-white text-xl font-display">
              Developed by <strong>Matthew Fugel</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://github.com/matthewf01/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-3 px-6 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 group min-w-[160px]"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span className="text-gray-300 group-hover:text-white font-medium">GitHub Profile</span>
            </a>
            <a 
              href="https://matthewfugel.wordpress.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-3 px-6 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 group min-w-[160px]"
            >
               <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M0 12c0 6.627 5.373 12 12 12s12-5.373 12-12-5.373-12-12-12-12 5.373-12 12zm2 0c0-5.523 4.477-10 10-10 1.956 0 3.774.566 5.308 1.54l-12.878 12.878c-1.488-2.196-2.43-4.819-2.43-7.653zm16.486 7.418c1.705-2.006 2.766-4.582 2.766-7.418 0-1.272-.23-2.493-.637-3.64l-8.082 12.632c2.253-.133 4.31-.699 5.953-1.574zm-9.354.218l6.766-10.575c.188.625.297 1.288.297 1.977 0 2.222-1.055 4.195-2.679 5.513l-4.384-3.085zm12.352-11.838c.328 1.309.516 2.684.516 4.102 0 4.14-1.637 7.906-4.286 10.636l-8.582-13.414c3.902-.914 8.281-.98 12.352-1.324z"/></svg>
               <span className="text-gray-300 group-hover:text-white font-medium">Technical Blog</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
