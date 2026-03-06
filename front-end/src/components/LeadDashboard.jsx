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
  const [filter, setFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

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

      if (userData.platform === 'mock') {
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

          // Mocking ANN Logic: High intent actions get higher scores
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
        // 2. FETCH FROM YOUR ANN BACKEND
        const response = await axios.get('http://localhost:3001/api/leads');
        currentLeads = response.data;
      }

      setLeads(currentLeads);

      // 3. UPDATE STATS (Using consistent thresholds: 75 and 40)
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

  // Logic filter  matches the ANN urgency thresholds
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Analyzing customer behavior...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Dashboard */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">📊</div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                <dd className="text-3xl font-semibold text-gray-900">{stats.total}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* High Priority Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">🔴</div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">High Intent (75+)</dt>
                <dd className="text-3xl font-semibold text-red-600">{stats.high}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Medium Priority Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">🟡</div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Medium Intent (40+)</dt>
                <dd className="text-3xl font-semibold text-yellow-600">{stats.medium}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Low Priority Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">🟢</div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Low Intent</dt>
                <dd className="text-3xl font-semibold text-green-600">{stats.low}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter by ANN Priority:</span>
          <div className="flex space-x-1">
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button onClick={fetchLeads} className="px-4 py-2 border rounded-md text-sm bg-white hover:bg-gray-50">Refresh</button>
          <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">Export CSV</button>
        </div>
      </div>

      {/* Grid */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No customers found for this priority level.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">ANN Scoring System</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Scores are generated via a Deep Learning Regression model based on social media shopping signals.
                <strong> High Intent (75+)</strong> indicates immediate purchase likelihood.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}