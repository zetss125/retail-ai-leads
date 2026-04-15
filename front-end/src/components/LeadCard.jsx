import React from 'react';

export default function LeadCard({ lead }) {
  // --- THE CRITICAL FIX ---
  // This turns the long "Customer 2" signal string into an array of individual tags
  const signalArray = typeof lead.signals === 'string' 
    ? lead.signals.split('; ') 
    : (Array.isArray(lead.signals) ? lead.signals : []);

  // Priority Logic matching your dataset thresholds
  const getPriorityColor = (score) => {
    if (score >= 80) return 'bg-red-50 border-red-200';
    if (score >= 45) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getPriorityText = (score) => {
    if (score >= 80) return 'HIGH PRIORITY';
    if (score >= 45) return 'MEDIUM PRIORITY';
    return 'LOW PRIORITY';
  };

  const getPlatformIcon = (platform) => {
    const p = platform?.toLowerCase();
    if (p === 'facebook') return '🔵';
    if (p === 'instagram') return '📸';
    if (p === 'tiktok') return '🎵';
    if (p === 'snapchat') return '👻';
    if (p === 'pinterest') return '📌';
    return '📱';
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${getPriorityColor(lead.score)}`}>
      {/* Header: Name, Email, and Platform */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mr-4 border border-gray-100">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">{lead.name}</h3>
            <p className="text-[11px] text-gray-500 font-medium tracking-tight">{lead.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xl mb-1">{getPlatformIcon(lead.platform)}</span>
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white border border-gray-100 text-gray-400 uppercase tracking-tighter">
            {lead.platform}
          </span>
        </div>
      </div>

      {/* Location */}
      {lead.location && (
        <div className="mb-6 flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <svg className="w-3 h-3 mr-1.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {lead.location}
        </div>
      )}

      {/* AI Performance Metrics */}
      <div className="mb-6 p-4 bg-white/60 rounded-xl border border-white shadow-inner">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Lead Probability</p>
            <p className="text-xs font-bold text-gray-800 tracking-tight">{getPriorityText(lead.score)}</p>
          </div>
          <div className="text-right leading-none">
            <span className={`text-2xl font-light ${lead.score >= 80 ? 'text-red-600' : 'text-gray-900'}`}>
              {lead.score}
            </span>
            <span className="text-[10px] font-bold text-gray-300 ml-0.5">%</span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${
              lead.score >= 80 ? 'bg-red-500' : lead.score >= 45 ? 'bg-orange-400' : 'bg-gray-400'
            }`}
            style={{ width: `${lead.score}%` }}
          ></div>
        </div>
      </div>

      {/* Signals Cluster: Fixed to split the long string into tags */}
      <div className="mb-6">
        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center">
          <span className="mr-2">⚡</span> Behavioral Signals
        </h4>
        <div className="flex flex-wrap gap-2">
          {signalArray.length > 0 ? (
            signalArray.map((signal, idx) => (
              <span 
                key={idx} 
                className="text-[10px] font-bold bg-white text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm hover:border-gray-300 transition-colors"
              >
                {signal}
              </span>
            ))
          ) : (
            <span className="text-xs italic text-gray-400">Monitoring customer activity...</span>
          )}
        </div>
      </div>

      {/* Conversion Actions */}
      <div className="flex space-x-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => window.open(`mailto:${lead.email}?subject=Exclusive Offer for you!`, '_blank')}
          className="flex-1 bg-black hover:bg-zinc-800 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all active:scale-95"
        >
          Direct Contact
        </button>
        <button
          onClick={() => alert(`Full CRM Data for ${lead.name}:\n\nTotal Interactions: ${signalArray.length}\nUrgency: ${lead.urgency}\nPlatform: ${lead.platform}`)}
          className="px-4 py-3 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-widest shadow-sm"
        >
          Profile
        </button>
      </div>
    </div>
  );
}