import React, { useState, useEffect } from 'react';
import { fetchLeads, deleteLead } from '../utils/api';
// Remove direct axios import to keep code clean if using utils/api

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [exporting, setExporting] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await fetchLeads();
      // Ensure data is an array before setting state
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load leads:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleSelectLead = (id) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await deleteLead(id);
      await loadLeads();
    } catch (error) {
      alert("Failed to delete lead.");
    }
  };

  const deleteSelectedLeads = async () => {
    if (!window.confirm(`Delete ${selectedLeads.length} selected leads?`)) return;
    try {
      // Delete all selected IDs
      await Promise.all(selectedLeads.map(id => deleteLead(id)));
      setSelectedLeads([]);
      await loadLeads();
    } catch (error) {
      console.error('Error deleting leads:', error);
    }
  };

  const exportSelectedToCSV = () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to export');
      return;
    }

    setExporting(true);
    const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id));
    const headers = ['Name', 'Email', 'Location', 'Score', 'Urgency', 'Platform', 'Date', 'Signals'];
    
    const csvData = selectedLeadData.map(lead => [
      lead.name,
      lead.email,
      lead.location,
      lead.score,
      lead.urgency,
      lead.platform,
      new Date(lead.timestamp).toLocaleDateString(),
      lead.signals?.join('; ') || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // UPDATED FILENAME
    a.download = `omnilead-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setExporting(false);
  };

  // Filter and sort leads
  const filteredLeads = leads
    .filter(lead => 
      (lead.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.location || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'date') {
        aValue = new Date(a.timestamp);
        bValue = new Date(b.timestamp);
      }

      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <div className="p-10 text-center">Loading AI Scored Leads...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* HEADER SECTION */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600">OmniLead AI Analysis: {leads.length} total leads found.</p>
        </div>
        <button onClick={loadLeads} className="bg-blue-600 text-white px-4 py-2 rounded shadow">
          Refresh Leads
        </button>
      </div>

      {/* ACTIONS BAR */}
      <div className="mb-6 flex gap-4 bg-white p-4 rounded shadow">
        <input 
          type="text" 
          placeholder="Search by name, email..." 
          className="flex-1 border p-2 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {selectedLeads.length > 0 && (
           <div className="flex gap-2">
             <button onClick={exportSelectedToCSV} className="bg-green-600 text-white px-3 py-1 rounded">Export CSV</button>
             <button onClick={deleteSelectedLeads} className="bg-red-600 text-white px-3 py-1 rounded">Delete ({selectedLeads.length})</button>
           </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}/></th>
              <th className="p-4 text-left">Lead</th>
              <th className="p-4 text-left">Score</th>
              <th className="p-4 text-left">Platform</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="p-4"><input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => handleSelectLead(lead.id)}/></td>
                <td className="p-4">
                  <div className="font-bold">{lead.name}</div>
                  <div className="text-sm text-gray-500">{lead.email} | {lead.location}</div>
                </td>
                <td className="p-4">
                  <span className={`font-bold ${lead.score > 70 ? 'text-red-600' : 'text-green-600'}`}>
                    {lead.score}%
                  </span>
                  <div className="text-xs text-gray-400">{lead.urgency}</div>
                </td>
                <td className="p-4"><span className="capitalize border px-2 py-1 rounded text-xs">{lead.platform}</span></td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => alert(lead.signals.join('\n'))} className="text-blue-600">Signals</button>
                  <button onClick={() => handleDeleteOne(lead.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}