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

  // Dynamic Backend URL
  const BACKEND_URL = import.meta.env.PROD
    ? 'https://retail-ai-leads.vercel.app'
    : 'http://localhost:3001';

  useEffect(() => {
    fetchLeads();
    
    // Refresh leads every 30 seconds
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let currentLeads = [];

      // Check if user is in Demo/Mock mode or Real Auth mode
      if (userData.platform === 'mock' || userData.platform === 'demo') {
        // 1. GENERATE CLOTHING RETAIL MOCK DATA
        const clothingItems = ["Winter Coat", "Silk Dress", "Straight-leg Jeans", "Leather Boots", "Handbag"];
        const retailSignals = [
          "Added [ITEM] to cart",
          "Asked for [ITEM] sizing",
          "Inquired about [ITEM] stock availability",
          "Used a promo code for [ITEM]",
          "Saved [ITEM] to wishlist",
          "Clicked on [ITEM] ad"
        ];

        currentLeads = Array.from({ length: 12 }, (_, i) => {
          const item = clothingItems[Math.floor(Math.random() * clothingItems.length)];
          const idNum = i + 1;
          const signals = retailSignals
            .sort(() => 0.5 - Math.random())
            .slice(0, 2 + Math.floor(Math.random() * 3))
            .map(s => s.replace("[ITEM]", item));

          const hasHighIntent = signals.some(s => s.includes('cart') || s.includes('promo'));
          const baseScore = hasHighIntent ? 70 : 20;
          const score = Math.min(100, baseScore + Math.floor(Math.random() * 30));

          return {
            id: `customer-${Date.now()}-${idNum}`,
            name: `Customer ${idNum}`,
            email: `customer${idNum}@email.com`,
            location: ['New York', 'Austin', 'Paris', 'London', 'Toronto'][Math.floor(Math.random() * 5)],
            score: score,
            signals: signals,
            urgency: score >= 75 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW',
            platform: ['Facebook', 'Instagram', 'TikTok'][Math.floor(Math.random() * 3)],
            timestamp: new Date().toISOString()
          };
        });
      } else {
        // 2. FETCH FROM YOUR VERCEL BACKEND (Corrected URL)
        const response = await axios.get(`${BACKEND_URL}/api/leads`);
        currentLeads = response.data;
      }

      setLeads(currentLeads);

      // 3. UPDATE STATS
      const highCount = currentLeads.filter(l => l.score >= 75).length;
      const mediumCount = currentLeads.filter(l => l.score >= 40 && l.score < 75).length;
      const lowCount = currentLeads.filter(l => l.score < 40).length;

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
    if (filter === 'high') return lead.score >= 75;
    if (filter === 'medium') return lead.score >= 40 && lead.score < 75;
    if (filter === 'low') return lead.score < 40;
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Location', 'Score', 'Urgency', 'Signals', 'Platform'];
    const csvData = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.location,
      lead.score,
      lead.urgency,
      lead.signals.join('; '),
      lead.platform
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600 font-serif uppercase tracking-widest text-xs">Analyzing behavior...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Dashboard */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-xl">
          <div className="p-5">
            <dt className="text-xs font-serif text-gray-500 uppercase tracking-wider">Total Leads</dt>
            <dd className="mt-1 text-3xl font-bold text-gray-900">{stats.total}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-xl">
          <div className="p-5">
            <dt className="text-xs font-serif text-red-500 uppercase tracking-wider">High Intent</dt>
            <dd className="mt-1 text-3xl font-bold text-red-600">{stats.high}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-xl">
          <div className="p-5">
            <dt className="text-xs font-serif text-yellow-500 uppercase tracking-wider">Warm Leads</dt>
            <dd className="mt-1 text-3xl font-bold text-yellow-600">{stats.medium}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm border border-gray-100 rounded-xl">
          <div className="p-5">
            <dt className="text-xs font-serif text-green-500 uppercase tracking-wider">Monitoring</dt>
            <dd className="mt-1 text-3xl font-bold text-green-600">{stats.low}</dd>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-xs font-serif text-gray-400 uppercase tracking-widest">Filter By Priority</span>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button onClick={fetchLeads} className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 uppercase tracking-tighter">Refresh</button>
          <button onClick={exportToCSV} className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black uppercase tracking-tighter">Export CSV</button>
        </div>
      </div>

      {/* Grid */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
          <p className="text-gray-400 font-serif italic text-sm">No leads match the selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}