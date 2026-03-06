import React from 'react';

export default function LeadCard({ lead }) {
  const getPriorityColor = (score) => {
    if (score > 60) return 'bg-red-50 border-red-200';
    if (score > 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getPriorityText = (score) => {
    if (score > 60) return 'HIGH PRIORITY';
    if (score > 30) return 'MEDIUM PRIORITY';
    return 'LOW PRIORITY';
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook': return '🔵';
      case 'twitter': return '🐦';
      case 'linkedin': return '💼';
      case 'mock': return '🧪';
      default: return '📱';
    }
  };

  return (
    <div className={`border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(lead.score)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{lead.name}</h3>
              <p className="text-sm text-gray-600">{lead.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-2 text-lg">{getPlatformIcon(lead.platform)}</span>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
            {lead.platform}
          </span>
        </div>
      </div>

      {/* Location */}
      {lead.location && (
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {lead.location}
          </div>
        </div>
      )}

      {/* Score and Priority */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Moving Score:</span>
          <div className={`px-3 py-1 rounded-full font-bold text-sm ${
            lead.score > 60 ? 'bg-red-100 text-red-800' :
            lead.score > 30 ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {lead.score}/100
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              lead.score > 60 ? 'bg-red-500' :
              lead.score > 30 ? 'bg-yellow-500' :
              'bg-gray-500'
            }`}
            style={{ width: `${lead.score}%` }}
          ></div>
        </div>
        <div className="mt-1 text-sm font-medium text-gray-700">
          {getPriorityText(lead.score)}
        </div>
      </div>

      {/* Signals */}
      {lead.signals && lead.signals.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">📋 Moving Signals:</h4>
          <ul className="space-y-1">
            {lead.signals.slice(0, 3).map((signal, idx) => (
              <li key={idx} className="flex items-start text-sm">
                <span className="text-green-500 mr-2 mt-0.5">✓</span>
                <span className="text-gray-700">{signal}</span>
              </li>
            ))}
            {lead.signals.length > 3 && (
              <li className="text-xs text-gray-500">
                +{lead.signals.length - 3} more signals
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.open(`mailto:${lead.email}?subject=Moving Services Inquiry&body=Hi ${lead.name}, we noticed you might be moving. We offer professional moving services. Would you like a free quote?`, '_blank')}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
        >
          📧 Email
        </button>
        <button
          onClick={() => alert(`Lead details:\n\nName: ${lead.name}\nEmail: ${lead.email}\nScore: ${lead.score}/100\nSignals: ${lead.signals?.join(', ')}`)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          👁️ View
        </button>
        <button
          onClick={() => console.log('Saved lead:', lead)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}