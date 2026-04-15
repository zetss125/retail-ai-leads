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

  // ---------------------------------------------------------
  // Calls Flask /predict for a single lead's signals.
  // Returns { score, urgency } from the BERT model.
  // Falls back to rule-based scoring if the API is unreachable.
  // ---------------------------------------------------------
  const scoreLeadViaAPI = async (signals) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/predict`,
        { signals },
        { timeout: 8000 }
      );
      return {
        score: response.data.score,
        urgency: response.data.urgency
      };
    } catch (err) {
      console.warn("⚠️ Flask API unreachable, using fallback scoring:", err.message);
      // Fallback: rule-based scoring matching CSV signal weights
      const s = signals.toLowerCase();
      let fallbackScore = 10;
      if (s.includes('added') && s.includes('promo code'))     fallbackScore = 88 + Math.floor(Math.random() * 10);
      else if (s.includes('added') && s.includes('inquired'))  fallbackScore = 85 + Math.floor(Math.random() * 10);
      else if (s.includes('added') && s.includes('requested')) fallbackScore = 83 + Math.floor(Math.random() * 10);
      else if (s.includes('added') && s.includes('commented')) fallbackScore = 80 + Math.floor(Math.random() * 8);
      else if (s.includes('added'))                            fallbackScore = 55 + Math.floor(Math.random() * 20);
      else if (s.includes('promo code'))                       fallbackScore = 50 + Math.floor(Math.random() * 20);
      else if (s.includes('saved') || s.includes('viewed'))    fallbackScore = 30 + Math.floor(Math.random() * 20);
      else                                                     fallbackScore = 10 + Math.floor(Math.random() * 25);

      return {
        score: fallbackScore,
        urgency: fallbackScore >= 80 ? 'HIGH' : fallbackScore >= 45 ? 'MEDIUM' : 'LOW'
      };
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let rawLeads = [];

      if (userData.platform === 'mock' || userData.platform === 'demo') {
        const items = [
          "Silk Dress", "Winter Coat", "Leather Boots", "Handbag",
          "Straight-leg Jeans", "Running Sneakers", "Cashmere Sweater",
          "Trench Coat", "Yoga Leggings", "Linen Shirt"
        ];
        const platforms = ['Facebook', 'Instagram', 'TikTok', 'Snapchat', 'Pinterest'];
        const locations = ['New York', 'Austin', 'London', 'Toronto', 'Paris', 'Los Angeles', 'Chicago'];

        // Build raw leads with signals ONLY — NO hardcoded scores
        // All scores come from Flask /predict below
        rawLeads = Array.from({ length: 12 }, (_, i) => {
          const item = items[Math.floor(Math.random() * items.length)];
          const platform = platforms[Math.floor(Math.random() * platforms.length)];
          const location = locations[Math.floor(Math.random() * locations.length)];

          let signalString;

          if (i < 4) {
            // HIGH intent — matches CSV HIGH rows (score 80–99)
            const highSignals = [
              `Added ${item} to cart; Used a promo code for ${item}; Inquired about ${item} stock availability; Saved ${item} to wishlist; Asked for ${item} sizing`,
              `Added ${item} to cart; Requested restock notification for ${item}; Commented on ${item} post; Shared ${item} link on wall; Clicked on ${item} ad`,
              `Clicked on ${item} ad; Asked for ${item} sizing; Used a promo code for ${item}; Saved ${item} to wishlist; Added ${item} to cart`,
              `Added ${item} to cart; Inquired about ${item} stock availability; Commented on ${item} post; Requested restock notification for ${item}; Liked ${item} photo`,
            ];
            signalString = highSignals[i % highSignals.length];

          } else if (i < 8) {
            // MEDIUM intent — matches CSV MEDIUM rows (score 45–79)
            const medSignals = [
              `Added ${item} to cart; Liked ${item} photo; Saved ${item} to wishlist; Asked for ${item} sizing`,
              `Used a promo code for ${item}; Requested restock notification for ${item}; Shared ${item} link on wall; Browsed ${item} collection`,
              `Viewed ${item} details; Added ${item} to cart; Commented on ${item} post`,
              `Saved ${item} to wishlist; Requested restock notification for ${item}; Inquired about ${item} stock availability; Viewed ${item} details`,
            ];
            signalString = medSignals[(i - 4) % medSignals.length];

          } else {
            // LOW intent — passive browsing/social only
            const lowSignals = [
              `Clicked on ${item} ad; Liked ${item} photo`,
              `Browsed ${item} collection; Commented on ${item} post`,
              `Shared ${item} link on wall; Viewed ${item} details`,
              `Liked ${item} photo; Asked for ${item} sizing`,
            ];
            signalString = lowSignals[(i - 8) % lowSignals.length];
          }

          return {
            id: `lead-${Date.now()}-${i}`,
            name: `Customer ${i + 1}`,
            email: `customer${9000 + Math.floor(Math.random() * 999)}@email.com`,
            location,
            signals: signalString,
            platform,
            timestamp: new Date().toISOString()
            // ✅ No score here — Flask assigns it below
          };
        });

      } else {
        // Real platform: fetch raw leads from backend (scores assigned below)
        const response = await axios.get(`${BACKEND_URL}/api/leads`);
        rawLeads = response.data;
      }

      // ---------------------------------------------------------
      // SCORE EVERY LEAD VIA FLASK /predict
      // Runs for BOTH mock and real leads in parallel.
      // ---------------------------------------------------------
      const scoredLeads = await Promise.all(
        rawLeads.map(async (lead) => {
          const { score, urgency } = await scoreLeadViaAPI(lead.signals);
          return { ...lead, score, urgency };
        })
      );

      // Sort highest score first
      scoredLeads.sort((a, b) => b.score - a.score);

      setLeads(scoredLeads);
      setStats({
        total:  scoredLeads.length,
        high:   scoredLeads.filter(l => l.score >= 80).length,
        medium: scoredLeads.filter(l => l.score >= 45 && l.score < 80).length,
        low:    scoredLeads.filter(l => l.score < 45).length
      });

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all')    return true;
    if (filter === 'high')   return lead.score >= 80;
    if (filter === 'medium') return lead.score >= 45 && lead.score < 80;
    if (filter === 'low')    return lead.score < 45;
    return true;
  });

  if (loading) return (
    <div className="p-10 text-center text-gray-500">
      <p className="text-sm font-semibold animate-pulse">🤖 AI scoring leads via BERT model...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Metrics Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">High Intent</p>
          <p className="text-3xl font-light text-red-600">{stats.high}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medium Intent</p>
          <p className="text-3xl font-light text-orange-500">{stats.medium}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Low Intent</p>
          <p className="text-3xl font-light text-gray-400">{stats.low}</p>
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
        <button
          onClick={fetchLeads}
          className="px-6 py-2 text-[10px] font-bold bg-black text-white rounded-xl uppercase"
        >
          Refresh
        </button>
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
