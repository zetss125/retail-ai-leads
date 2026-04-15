import React, { useState, useEffect } from 'react';
import LeadCard from './LeadCard';
import axios from 'axios';

export default function LeadDashboard({ userData }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [filter, setFilter] = useState('all');

  // Dynamic Backend URL
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

      // Check if we are in Mock/Demo mode or fetching from the real Railway API
      if (userData.platform === 'mock' || userData.platform === 'demo') {
        
        // --- DATASET-ACCURATE MOCK GENERATION ---
        const items = ["Silk Dress", "Winter Coat", "Leather Boots", "Handbag", "Straight-leg Jeans", "Trench Coat"];
        
        currentLeads = Array.from({ length: 12 }, (_, i) => {
          const item = items[Math.floor(Math.random() * items.length)];
          
          // To fix the "69% cap", we force specific leads to have the HIGH INTENT pattern:
          // 1. Keyword: HIGH Urgency
          // 2. Format: Long semicolon-separated signals
          const isHighValue = i < 5; // First 5 leads will be the "Stars" of the demo

          let urgency, signals, score;

          if (isHighValue) {
            urgency = "HIGH";
            const highIntentCluster = [
              `Added ${item} to cart`,
              `Viewed ${item} details`,
              `Asked for ${item} sizing`,
              `Requested restock notification for ${item}`,
              `Saved ${item} to wishlist`,
              `Used a promo code for ${item}`
            ];
            // JOINING WITH SEMICOLON: This is what the BERT model expects for 80+ scores
            signals = highIntentCluster.join("; "); 
            
            // Set score between 85 and 99 to show the "High Intent" classification
            score = 85 + Math.floor(Math.random() * 14); 
          } else {
            // MEDIUM/LOW INTENT PATTERN
            urgency = Math.random() > 0.5 ? "MEDIUM" : "LOW";
            signals = [
              `Clicked on ${item} ad`,
              `Browsed ${item} collection`,
              `Liked ${item} photo`
            ].join("; ");
            score = 20 + Math.floor(Math.random() * 45); // Maxes out around 65
          }

          return {
            id: `lead-${Date.now()}-${i}`,
            name: `Lead #${12500 + i}`,
            email: `customer${12500 + i}@email.com`,
            location: ['New York', 'Austin', 'Paris', 'London', 'Toronto', 'Chicago'][Math.floor(Math.random() * 6)],
            score: score,
            signals: signals,
            urgency: urgency,
            platform: ['Instagram', 'Facebook', 'TikTok'][Math.floor(Math.random() * 3)],
            timestamp: new Date().toISOString()
          };
        });
      } else {
        // --- REAL API FETCH ---
        const response = await axios.get(`${BACKEND_URL}/api/leads`);
        currentLeads = response.data;
      }

      setLeads(currentLeads);
      
      // Calculate Stats based on the correct thresholds
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
      lead.name, lead.email, lead.location, lead.score, lead.urgency, lead.signals, lead.platform
    ]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retail-ai-leads-report.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-400 font-serif uppercase tracking-[0.3em] text-[10px]">AI Lead Scoring Engine Live...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
      
      {/* 1. TOP STATS BAR */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Total Prospects" value={stats.total} color="text-black" />
        <MetricCard label="High Intent (80+)" value={stats.high} color="text-red-600" />
        <MetricCard label="Warm Leads" value={stats.medium} color="text-orange-500" />
        <MetricCard label="Monitoring" value={stats.low} color="text-gray-300" />
      </div>

      {/* 2. FILTER & ACTION HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center space-x-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline View</span>
          <div className="flex space-x-1 bg-gray-50 p-1 rounded-xl">
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${
                  filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button onClick={fetchLeads} className="px-5 py-2 text-[10px] font-bold border border-gray-200 rounded-xl hover:bg-gray-50 uppercase tracking-widest">Refresh API</button>
          <button onClick={exportToCSV} className="px-5 py-2 text-[10px] font-bold bg-black text-white rounded-xl hover:bg-zinc-800 uppercase tracking-widest">Download CSV</button>
        </div>
      </div>

      {/* 3. LEAD CARDS GRID */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-serif italic text-sm">No leads currently in this priority tier.</p>
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

// Stats Card Component
function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</p>
      <p className={`mt-2 text-4xl font-light ${color}`}>{value}</p>
    </div>
  );
}