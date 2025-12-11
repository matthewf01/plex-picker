
import React from 'react';

interface SupportProps {
  onClose: () => void;
}

export const Support: React.FC<SupportProps> = ({ onClose }) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-10 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-white">Support The Developer</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">✕ Close</button>
      </div>
      
      <div className="bg-plex-slate/30 p-8 rounded-2xl border border-white/5 shadow-xl text-center">
        <div className="w-20 h-20 bg-plex-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
           <span className="text-4xl">🍿</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-4">Did you find this awesome?</h3>
        <p className="text-gray-300 leading-relaxed mb-8 max-w-lg mx-auto">
          PlexPicker is a passion project built to cure choice paralysis. 
          If it helped you find something great to watch tonight, consider buying me a soda (or dinner) for my next movie night!
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="https://paypal.me/matthewfugel/5" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center gap-2 px-6 py-4 bg-plex-orange text-black font-bold rounded-xl hover:bg-white hover:scale-105 transition-all shadow-lg shadow-plex-orange/20"
          >
            <span>🥤</span>
            <span>Buy me a Soda ($5)</span>
          </a>
          
          <a 
            href="https://paypal.me/matthewfugel" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 text-white border border-white/20 font-bold rounded-xl hover:bg-white/20 hover:scale-105 transition-all"
          >
            <span>🍕</span>
            <span>Buy me dinner</span>
          </a>
        </div>
        
        <p className="mt-8 text-xs text-gray-500">
          Transactions are securely handled via PayPal. Thank you for your support!
        </p>
      </div>
    </div>
  );
};
