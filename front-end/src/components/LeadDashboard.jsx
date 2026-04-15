import React, { useState, useEffect } from 'react';
import LeadCard from './LeadCard';
import axios from 'axios';

export default function LeadDashboard({ userData }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [filter, setFilter] = useState('all'); 

  // Dynamic Backend URL - Points to your Railway deployment
  const BACKEND_URL = import.meta.env.PROD
    ? 'https://your-railway-url.railway.app' 
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
        // --- 1. ENHANCED MOCK DATA GENERATION ---
        const clothingItems = ["Winter Coat", "Silk Dress", "Straight-leg Jeans", "Leather Boots", "Handbag", "Cashmere Sweater"];
        const retailSignals = [
          "Added [ITEM] to cart",
          "Used a promo code for [ITEM]",
          "Inquired about [ITEM] stock availability",
          "Requested restock notification for [ITEM]",
          "Asked for [ITEM] sizing",
          "Saved [ITEM] to wishlist",
          "Clicked on [ITEM] ad"
        ];

        currentLeads = Array.from({ length: 12 }, (_, i) => {
          const item = clothingItems[Math.floor(Math.random() * clothingItems.length)];
          
          // Randomly select 2-4 signals
          const signals = retailSignals
            .sort(() => 0.5 - Math.random())
            .slice(0, 2 + Math.floor(Math.random() * 3))
            .map(s => s.replace("[ITEM]", item));

          // HIGH INTENT LOGIC: Crossing the 80% Threshold
          const hasHighIntent = signals.some(s => 
            s.includes('cart') || s.includes('promo') || s.includes('stock') || s.includes('restock')
          );

          // If high intent, base is 82. If not, base is 25.
          const baseScore = hasHighIntent ? 82 : 25;
          // Add a random "polish" to make scores look unique (e.g., 87%, 91%, etc.)
          const score = Math.min(100, baseScore + Math.floor(Math.random() * 15));

          return {
            id: `customer-${Date.now()}-${i}`,
            name: `Lead #${1000 + i}`,
            email: `client${i}@example.com`,
            location: ['New York', 'Austin', 'Paris', 'London', 'Toronto', 'Tokyo'][Math.floor(Math.random() * 6)],
            score: score,
            signals: signals,
            urgency: score >= 80 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW',
            platform: ['Facebook', 'Instagram', 'TikTok', 'Google'][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString()
          };
        });
      } else {
        // --- 2. FETCH FROM REAL RAILWAY BACKEND ---
        const response = await axios.get(`${BACKEND_URL}/api/leads`);
        currentLeads = response.data;
      }

      setLeads(currentLeads);

      // --- 3. UPDATED STATS CALCULATION ---
      const highCount = currentLeads.filter(l => l.score >= 80).length;
      const mediumCount = currentLeads.filter(l => l.score >= 45 && l.score < 80).length;
      const lowCount = currentLeads.filter(l => l.score < 45).length;

      setStats({
        total: currentLeads.length,
        high: highCount,
        medium: mediumCount,
        low: lowCount
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
    a.download = `retail-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-black"></div>
          <p className="mt-4 text-gray-500 font-serif uppercase tracking-widest text-[10px]">AI Scoring Engine Live...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Stats Dashboard */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem label="Total Potential" value={stats.total} color="text-gray-900" />
        <StatItem label="High Conversion" value={stats.high} color="text-red-600" />
        <StatItem label="Warm Prospects" value={stats.medium} color="text-orange-500" />
        <StatItem label="Nurture Queue" value={stats.low} color="text-blue-500" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-[10px] font-serif text-gray-400 uppercase tracking-[0.2em]">Priority Filter</span>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-tighter ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button onClick={fetchLeads} className="px-5 py-2 text-[10px] font-bold border border-gray-200 rounded-xl hover:bg-gray-50 uppercase tracking-widest">Sync</button>
          <button onClick={exportToCSV} className="px-5 py-2 text-[10px] font-bold bg-black text-white rounded-xl hover:bg-zinc-800 uppercase tracking-widest">Export</button>
        </div>
      </div>

      {/* Grid */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-serif italic text-sm">Waiting for incoming signals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for Stats
function StatItem({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <dt className="text-[10px] font-serif text-gray-400 uppercase tracking-widest">{label}</dt>
      <dd className={`mt-2 text-4xl font-light ${color}`}>{value}</dd>
    </div>
  );
}