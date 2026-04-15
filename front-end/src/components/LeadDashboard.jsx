import React, { useState, useEffect } from 'react';
import LeadCard from './LeadCard';
import axios from 'axios';

export default function LeadDashboard({ userData }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [filter, setFilter] = useState('all'); 

  const BACKEND_URL = import.meta.env.PROD
    ? 'https://your-railway-app.railway.app' // Update with your actual Railway URL
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
        // --- 1. CONFIGURATION MATCHING YOUR DATASET ---
        const clothingItems = ["Winter Coat", "Silk Dress", "Straight-leg Jeans", "Leather Boots", "Handbag", "Cashmere Sweater", "Linen Shirt", "Trench Coat"];
        
        const highSignals = ["Added [ITEM] to cart", "Used a promo code for [ITEM]", "Requested restock notification for [ITEM]", "Inquired about [ITEM] stock availability"];
        const midSignals = ["Asked for [ITEM] sizing", "Saved [ITEM] to wishlist", "Viewed [ITEM] details", "Shared [ITEM] link on wall"];
        const lowSignals = ["Clicked on [ITEM] ad", "Browsed [ITEM] collection", "Liked [ITEM] photo", "Commented on [ITEM] post"];

        currentLeads = Array.from({ length: 12 }, (_, i) => {
          const item = clothingItems[Math.floor(Math.random() * clothingItems.length)];
          const urgencyRand = Math.random();
          
          let urgency, signals, baseScore;

          // --- 2. LOGIC MATCHING YOUR DATASET SCORING ---
          if (urgencyRand > 0.7) { 
            // HIGH INTENT (Dataset Score: 80-100)
            urgency = 'HIGH';
            signals = [
              ...highSignals.sort(() => 0.5 - Math.random()).slice(0, 2),
              ...midSignals.sort(() => 0.5 - Math.random()).slice(0, 2),
              ...lowSignals.sort(() => 0.5 - Math.random()).slice(0, 1)
            ];
            baseScore = 80 + Math.floor(Math.random() * 18); // 80 to 98
          } else if (urgencyRand > 0.3) {
            // MEDIUM INTENT (Dataset Score: 45-79)
            urgency = 'MEDIUM';
            signals = [
              ...midSignals.sort(() => 0.5 - Math.random()).slice(0, 2),
              ...lowSignals.sort(() => 0.5 - Math.random()).slice(0, 2)
            ];
            baseScore = 45 + Math.floor(Math.random() * 34); // 45 to 79
          } else {
            // LOW INTENT (Dataset Score: 10-44)
            urgency = 'LOW';
            signals = [
              ...lowSignals.sort(() => 0.5 - Math.random()).slice(0, 3)
            ];
            baseScore = 10 + Math.floor(Math.random() * 34); // 10 to 44
          }

          const processedSignals = signals.map(s => s.replace("[ITEM]", item));

          return {
            id: `customer-${Date.now()}-${i}`,
            name: `Lead #${12500 + i}`,
            email: `customer${12500 + i}@email.com`,
            location: ['New York', 'Austin', 'Paris', 'London', 'Toronto', 'Houston', 'Miami', 'Chicago'][Math.floor(Math.random() * 8)],
            score: baseScore,
            signals: processedSignals,
            urgency: urgency,
            platform: ['Facebook', 'Instagram', 'TikTok', 'Snapchat', 'Pinterest'][Math.floor(Math.random() * 5)],
            timestamp: new Date().toISOString()
          };
        });
      } else {
        const response = await axios.get(`${BACKEND_URL}/api/leads`);
        currentLeads = response.data;
      }

      setLeads(currentLeads);

      // --- 3. STATS CALCULATION ---
      setStats({
        total: currentLeads.length,
        high: currentLeads.filter(l => l.score >= 80).length,
        medium: currentLeads.filter(l => l.score >= 45 && l.score < 80).length,
        low: currentLeads.filter(l => l.score < 45).length
      });

    } catch (error) {
      console.error("Error fetching leads:", error);
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
      lead.name, lead.email, lead.location, lead.score, lead.urgency, lead.signals.join('; '), lead.platform
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retail-leads-export.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-500 font-serif uppercase tracking-[0.3em] text-[10px]">Processing Data Streams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Header */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Total Leads" value={stats.total} color="text-black" />
        <StatCard label="High Intent (80+)" value={stats.high} color="text-red-600" />
        <StatCard label="Warm Prospects" value={stats.medium} color="text-orange-500" />
        <StatCard label="Browsers" value={stats.low} color="text-gray-400" />
      </div>

      {/* Control Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center space-x-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter Pipeline</span>
          <div className="flex space-x-1">
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-[10px] font-bold rounded-full transition-all ${
                  filter === f ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button onClick={fetchLeads} className="px-4 py-2 text-[10px] font-bold border border-gray-200 rounded-full hover:bg-gray-50">REFRESH</button>
          <button onClick={exportToCSV} className="px-4 py-2 text-[10px] font-bold bg-black text-white rounded-full hover:bg-zinc-800">EXPORT DATA</button>
        </div>
      </div>

      {/* Lead Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</p>
      <p className={`mt-2 text-3xl font-light ${color}`}>{value}</p>
    </div>
  );
}