import React, { useState, useEffect } from 'react';
import LeadCard from './LeadCard';
import axios from 'axios';

export default function LeadDashboard({ userData }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [filter, setFilter] = useState('all');

  const BACKEND_URL = import.meta.env.PROD
    ? 'https://your-railway-app-url.railway.app' 
    : 'http://localhost:8080';

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let currentLeads = [];

      if (userData.platform === 'mock' || userData.platform === 'demo') {
        const items = ["Silk Dress", "Winter Coat", "Leather Boots", "Handbag", "Straight-leg Jeans"];
        
        currentLeads = Array.from({ length: 12 }, (_, i) => {
          const item = items[Math.floor(Math.random() * items.length)];
          const isHigh = i < 5; // First 5 leads are high priority

          let urgency, signalString, score;

          if (isHigh) {
            urgency = "HIGH";
            // EXACT STRING FORMAT FROM DATASET
            signalString = `Added ${item} to cart; Viewed ${item} details; Asked for ${item} sizing; Requested restock notification for ${item}; Saved ${item} to wishlist`;
            score = 88 + Math.floor(Math.random() * 11); 
          } else {
            urgency = "LOW";
            signalString = `Clicked on ${item} ad; Liked ${item} photo`;
            score = 15 + Math.floor(Math.random() * 30);
          }

          return {
            id: `lead-${Date.now()}-${i}`,
            name: `Lead #${12500 + i}`,
            email: `customer${12500 + i}@email.com`,
            location: ['New York', 'Austin', 'London'][Math.floor(Math.random() * 3)],
            score: score,
            signals: signalString, // Passing the full string
            urgency: urgency,
            platform: 'Instagram',
            timestamp: new Date().toISOString()
          };
        });
      } else {
        const response = await axios.get(`${BACKEND_URL}/api/leads`);
        currentLeads = response.data;
      }

      setLeads(currentLeads);
      setStats({
        total: currentLeads.length,
        high: currentLeads.filter(l => l.score >= 80).length,
        medium: currentLeads.filter(l => l.score >= 45 && l.score < 80).length,
        low: currentLeads.filter(l => l.score < 45).length
      });

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    if (filter === 'high') return lead.score >= 80;
    if (filter === 'medium') return lead.score >= 45 && lead.score < 80;
    if (filter === 'low') return lead.score < 45;
    return true;
  });

  if (loading) return <div className="p-10 text-center">Loading AI Pipeline...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Metrics Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">High Intent</p>
          <p className="text-3xl font-light text-red-600">{stats.high}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Leads</p>
          <p className="text-3xl font-light">{stats.total}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-8 flex justify-between items-center border-b pb-6">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
          {['all', 'high', 'medium', 'low'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 text-[10px] font-bold rounded-lg uppercase transition-all ${
                filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={fetchLeads} className="px-6 py-2 text-[10px] font-bold bg-black text-white rounded-xl uppercase">Refresh</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}