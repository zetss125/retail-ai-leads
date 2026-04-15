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
          const isHighValue = i < 5; 

          // We define these as STRINGS immediately to match the CSV format
          let urgency, signalString, score;

          if (isHighValue) {
            urgency = "HIGH";
            // ONE SINGLE STRING with semicolons - No Arrays!
            signalString = `Added ${item} to cart; Viewed ${item} details; Asked for ${item} sizing; Requested restock notification for ${item}; Saved ${item} to wishlist; Used a promo code for ${item}`;
            score = 88 + Math.floor(Math.random() * 11); 
          } else {
            urgency = "LOW";
            signalString = `Clicked on ${item} ad; Liked ${item} photo`;
            score = 10 + Math.floor(Math.random() * 30); 
          }

          return {
            id: `lead-${Date.now()}-${i}`,
            name: `Lead #${12500 + i}`,
            email: `customer${12500 + i}@email.com`,
            location: ['New York', 'Austin', 'London'][Math.floor(Math.random() * 3)],
            score: score,
            signals: signalString, // Passing the string directly
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
      console.error("Error:", error);
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

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Location', 'Score', 'Urgency', 'Signals', 'Platform'];
    const csvData = filteredLeads.map(lead => [
      lead.name, lead.email, lead.location, lead.score, lead.urgency, lead.signals, lead.platform
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-pulse">
          <div className="inline-block h-12 w-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing BERT Scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Metrics Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Total Leads" value={stats.total} color="text-black" />
        <MetricCard label="High Priority" value={stats.high} color="text-red-600" />
        <MetricCard label="Nurturing" value={stats.medium} color="text-orange-500" />
        <MetricCard label="In Queue" value={stats.low} color="text-gray-300" />
      </div>

      {/* Toolbar */}
      <div className="mb-8 flex justify-between items-center border-b border-gray-100 pb-6">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
          {['all', 'high', 'medium', 'low'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 text-[10px] font-bold rounded-lg uppercase tracking-tighter transition-all ${
                filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          <button onClick={fetchLeads} className="px-6 py-2 text-[10px] font-bold border border-gray-200 rounded-xl hover:bg-gray-50 uppercase">Sync</button>
          <button onClick={exportToCSV} className="px-6 py-2 text-[10px] font-bold bg-black text-white rounded-xl hover:bg-zinc-800 uppercase">Export</button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`mt-2 text-4xl font-light ${color}`}>{value}</p>
    </div>
  );
}