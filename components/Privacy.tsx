import React from 'react';

interface PrivacyProps {
  onClose: () => void;
}

export const Privacy: React.FC<PrivacyProps> = ({ onClose }) => {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-10 animate-in fade-in">
       <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-white">Privacy Policy</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">✕ Close</button>
      </div>

      <div className="space-y-10 text-gray-300 text-sm md:text-base font-light leading-relaxed">
        <section className="bg-white/5 p-6 rounded-xl border border-white/5">
          <p className="italic text-gray-400 mb-2">Last Updated: December 2025</p>
          <p>
            This application is created for personal and entertainment purposes only. 
            We prioritize your privacy by keeping logic client-side wherever possible.
          </p>
        </section>

        <section>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-plex-orange rounded-full"></span>
            How Information is Processed
          </h3>
          <ul className="list-none space-y-4 pl-2">
            <li className="flex gap-3">
              <span className="text-plex-orange font-bold">•</span>
              <div>
                <strong className="text-white block mb-1">Local Storage</strong>
                Your Plex connection details (URL and Token) are stored locally in your browser's Local Storage (<code className="bg-black/50 px-1 py-0.5 rounded text-xs">plex_config</code>). This allows the app to remember your server between visits. This data never leaves your browser except to communicate with Plex.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-plex-orange font-bold">•</span>
              <div>
                <strong className="text-white block mb-1">Plex API</strong>
                The application communicates directly from your browser to your Plex Media Server (or Plex.tv) to fetch your library content.
              </div>
            </li>
            <li className="flex gap-3">
               <span className="text-plex-orange font-bold">•</span>
               <div>
                <strong className="text-white block mb-1">AI Processing</strong>
                To generate recommendations, specific metadata from your library (Titles, Summaries, Genres) is sent to Google's Gemini API. This data is used solely to generate the response.
               </div>
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
            Third Parties
          </h3>
          <p className="mb-4 text-gray-400">We utilize the following services to run this application:</p>
          <div className="grid md:grid-cols-2 gap-4">
             <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col items-start">
                <strong className="text-white block mb-1">Vercel</strong>
                <p className="text-sm text-gray-400 mb-3 flex-1">Web hosting and anonymous analytics.</p>
                <a 
                  href="https://vercel.com/legal/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-plex-orange hover:text-white border-b border-plex-orange/30 hover:border-white transition-colors"
                >
                  Read Privacy Policy ↗
                </a>
             </div>
             <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col items-start">
                <strong className="text-white block mb-1">Google Gemini</strong>
                <p className="text-sm text-gray-400 mb-3 flex-1">AI Intelligence for recommendations.</p>
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-plex-orange hover:text-white border-b border-plex-orange/30 hover:border-white transition-colors"
                >
                  Read Privacy Policy ↗
                </a>
             </div>
             <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col items-start">
                <strong className="text-white block mb-1">Plex Inc.</strong>
                <p className="text-sm text-gray-400 mb-3 flex-1">Source of media metadata.</p>
                <a 
                  href="https://www.plex.tv/about/privacy-legal/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-plex-orange hover:text-white border-b border-plex-orange/30 hover:border-white transition-colors"
                >
                  Read Privacy Policy ↗
                </a>
             </div>
          </div>
        </section>

        <section>
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-red-500 rounded-full"></span>
            Disclaimer
          </h3>
          <p>
            We make no promises regarding data persistence or uptime. 
            As this is a client-side application, clearing your browser cache will remove your stored server connection.
          </p>
        </section>
      </div>
    </div>
  );
};