import React from 'react';

export default function LeadCard({ lead }) {
  // THIS IS THE CRITICAL FIX:
  // We take the long string "Added...; Viewed...;" and turn it into an array
  const signalArray = typeof lead.signals === 'string' 
    ? lead.signals.split('; ') 
    : (Array.isArray(lead.signals) ? lead.signals : []);

  const getPriorityColor = (score) => {
    if (score >= 80) return 'bg-red-50 border-red-200';
    if (score >= 45) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-sm ${getPriorityColor(lead.score)}`}>
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{lead.name}</h3>
          <p className="text-xs text-gray-500">{lead.email}</p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-white border uppercase">
          {lead.platform}
        </span>
      </div>

      {/* AI Score Visual */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Score</span>
          <span className="text-xl font-bold">{lead.score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${lead.score >= 80 ? 'bg-red-500' : 'bg-orange-400'}`}
            style={{ width: `${lead.score}%` }}
          ></div>
        </div>
      </div>

      {/* THE SIGNALS SECTION - SPLITTING THE STRING */}
      <div className="mb-4">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Intent Signals</h4>
        <div className="flex flex-wrap gap-2">
          {signalArray.map((signal, idx) => (
            <span 
              key={idx} 
              className="text-[10px] font-medium bg-white text-gray-700 px-2 py-1 rounded border border-gray-100 shadow-sm"
            >
              {signal}
            </span>
          ))}
        </div>
      </div>

      <div className="flex space-x-2 pt-4 border-t border-gray-100">
        <button className="flex-1 bg-black text-white py-2 rounded-xl text-[10px] font-bold uppercase">Contact</button>
      </div>
    </div>
  );
}