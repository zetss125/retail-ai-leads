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
        const items = [
          "Silk Dress", "Winter Coat", "Leather Boots", "Handbag",
          "Straight-leg Jeans", "Running Sneakers", "Cashmere Sweater",
          "Trench Coat", "Yoga Leggings", "Linen Shirt"
        ];
        const platforms = ['Facebook', 'Instagram', 'TikTok', 'Snapchat', 'Pinterest'];
        const locations = ['New York', 'Austin', 'London', 'Toronto', 'Paris', 'Los Angeles', 'Chicago'];

        currentLeads = Array.from({ length: 12 }, (_, i) => {
          const item = items[Math.floor(Math.random() * items.length)];
          const platform = platforms[Math.floor(Math.random() * platforms.length)];
          const location = locations[Math.floor(Math.random() * locations.length)];

          let urgency, signalString, score;

          if (i < 4) {
            // HIGH priority — mirrors CSV rows scoring 82–99
            // Must include "Added to cart" + high-weight signals like promo/stock inquiry
            urgency = "HIGH";
            const highSignalSets = [
              `Added ${item} to cart; Used a promo code for ${item}; Inquired about ${item} stock availability; Saved ${item} to wishlist; Asked for ${item} sizing`,
              `Added ${item} to cart; Requested restock notification for ${item}; Commented on ${item} post; Shared ${item} link on wall; Clicked on ${item} ad`,
              `Clicked on ${item} ad; Asked for ${item} sizing; Used a promo code for ${item}; Saved ${item} to wishlist; Added ${item} to cart`,
              `Added ${item} to cart; Inquired about ${item} stock availability; Commented on ${item} post; Requested restock notification for ${item}; Liked ${item} photo`,
            ];
            signalString = highSignalSets[i % highSignalSets.length];
            score = 82 + Math.floor(Math.random() * 17); // 82–99

          } else if (i < 8) {
            // MEDIUM priority — mirrors CSV rows scoring 45–79
            urgency = "MEDIUM";
            const medSignalSets = [
              `Added ${item} to cart; Liked ${item} photo; Saved ${item} to wishlist; Asked for ${item} sizing`,
              `Used a promo code for ${item}; Requested restock notification for ${item}; Shared ${item} link on wall; Browsed ${item} collection`,
              `Viewed ${item} details; Added ${item} to cart; Commented on ${item} post`,
              `Saved ${item} to wishlist; Requested restock notification for ${item}; Inquired about ${item} stock availability; Viewed ${item} details`,
            ];
            signalString = medSignalSets[(i - 4) % medSignalSets.length];
            score = 45 + Math.floor(Math.random() * 34); // 45–78

          } else {
            // LOW priority — passive browsing/social only
            urgency = "LOW";
            const lowSignalSets = [
              `Clicked on ${item} ad; Liked ${item} photo`,
              `Browsed ${item} collection; Commented on ${item} post`,
              `Shared ${item} link on wall; Viewed ${item} details`,
              `Liked ${item} photo; Asked for ${item} sizing`,
            ];
            signalString = lowSignalSets[(i - 8) % lowSignalSets.length];
            score = 12 + Math.floor(Math.random() * 30); // 12–41
          }

          return {
            id: `lead-${Date.now()}-${i}`,
            name: `Customer ${12500 + i}`,
            email: `customer${9000 + Math.floor(Math.random() * 999)}@email.com`,
            location,
            score,
            signals: signalString,
            urgency,
            platform,
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
