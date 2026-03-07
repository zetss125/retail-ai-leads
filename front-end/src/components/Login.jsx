import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Login({ onLogin, logo }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('facebook');

  // Define the backend URL based on environment
  const BACKEND_URL = import.meta.env.PROD
    ? 'https://retail-ai-leads.vercel.app'
    : 'http://localhost:3001';

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      handleTokenAnalysis(token);
    }
  }, []);

  const handleTokenAnalysis = async (token) => {
    setLoading(true);
    try {
      // Points to your Vercel backend
      const response = await axios.post(`${BACKEND_URL}/api/analyze-facebook`, { 
        accessToken: token 
      });
      onLogin({ token, user: response.data.lead, platform: 'facebook' });
    } catch (err) {
      console.error("Auth Error:", err);
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    // Redirects user to the Vercel Facebook Auth route
    window.location.href = `${BACKEND_URL}/auth/facebook`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* LOGO SECTION - Note: check if path needs to be /assets/signature-logo.jpg in production */}
        <img 
          src={logo || "./assets/signature-logo.jpg"} 
          alt="Signature Logo" 
          className="mx-auto h-24 w-auto mb-4" 
        />
        <h2 className="text-3xl font-serif font-extrabold text-gray-900 tracking-widest uppercase">
          Signature
        </h2>
        <p className="mt-2 text-sm text-gray-500 uppercase tracking-widest">
          Lead Intelligence Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-xl sm:px-10">
          
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`flex-1 pb-4 text-sm font-medium ${activeTab === 'facebook' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-400'}`}
              onClick={() => setActiveTab('facebook')}
            >
              Social Login
            </button>
            <button
              className={`flex-1 pb-4 text-sm font-medium ${activeTab === 'mock' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-400'}`}
              onClick={() => setActiveTab('mock')}
            >
              Demo Access
            </button>
          </div>

          {activeTab === 'facebook' ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 text-center">
                Analyze your social signals to identify high-intent retail customers.
              </p>
              <button
                onClick={handleFacebookLogin}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none transition-all"
              >
                {loading ? 'Processing...' : 'Sync with Facebook Ads'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => onLogin({ token: 'demo-token', user: { name: 'Retail Manager' }, platform: 'demo' })}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Enter Demo Dashboard
              </button>
            </div>
          )}

          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
        </div>
        
        <p className="mt-6 text-center text-xs text-gray-400 italic">
          &copy; {new Date().getFullYear()} Signature Luxury Retail Group
        </p>
      </div>
    </div>
  );
}