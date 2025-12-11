
import React, { useState } from 'react';
import { Wheel } from './Wheel';

interface SupportProps {
  onClose: () => void;
}

const DONATION_OPTIONS = [
  { id: '5', label: 'Soda ($5)' },
  { id: '10', label: 'Snacks ($10)' },
  { id: '20', label: 'Pizza ($20)' },
  { id: 'custom', label: 'Surprise' }
];

export const Support: React.FC<SupportProps> = ({ onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState('5');

  const getPaypalLink = () => {
    const baseUrl = 'https://paypal.me/matthewfugel';
    if (selectedAmount === 'custom') return baseUrl;
    return `${baseUrl}/${selectedAmount}`;
  };

  const getButtonText = () => {
    const opt = DONATION_OPTIONS.find(o => o.id === selectedAmount);
    return `Send ${opt?.label.split(' ')[0] || 'Gift'}`;
  };

  const getEmoji = () => {
    switch (selectedAmount) {
      case '5': return '🥤';
      case '10': return '🍿';
      case '20': return '🍕';
      case 'custom': return '🎁';
      default: return '🍿';
    }
  };

  const isSurprise = selectedAmount === 'custom';

  return (
    <div className="w-full max-w-lg mx-auto p-1 animate-in zoom-in-95 duration-200">
      <div className="bg-plex-slate/60 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl text-center relative">
        
        {/* Close Button Inside */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="w-24 h-24 bg-plex-orange/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-plex-orange/20 transition-all duration-300">
           <span className="text-5xl animate-in zoom-in duration-300" key={selectedAmount}>{getEmoji()}</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-4">Did you find this awesome?</h3>
        <p className="text-gray-300 leading-relaxed mb-8 text-sm">
          PlexPicker is a passion project built to cure choice paralysis. 
          If it helped you find something great to watch tonight, consider sending a gift!
        </p>

        <div className="max-w-xs mx-auto mb-10">
           <Wheel 
             options={DONATION_OPTIONS} 
             selected={selectedAmount} 
             onChange={setSelectedAmount} 
             title="Select Gift"
             onSpin={true}
           />
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <a 
            href={getPaypalLink()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`
              inline-flex items-center justify-center gap-2 px-12 py-4 font-bold rounded-full 
              hover:scale-105 transition-all duration-300 shadow-lg uppercase tracking-widest text-sm
              ${isSurprise 
                ? 'bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 text-white border-none shadow-purple-500/20 hover:shadow-purple-500/40' 
                : 'bg-plex-orange text-black hover:bg-white shadow-plex-orange/20'
              }
            `}
          >
            <span>{isSurprise ? '✨' : getEmoji()}</span>
            <span>{getButtonText()}</span>
          </a>
        </div>
        
        <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-wider">
          Securely handled via PayPal
        </p>
      </div>
    </div>
  );
};
