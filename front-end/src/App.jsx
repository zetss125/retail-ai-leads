import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import LeadDashboard from './components/LeadDashboard';
import Header from './components/Header';
import Settings from './components/Settings';
import LeadsPage from './components/LeadsPage';

// Import the logo correctly from your src/assets folder
import logo from './assets/signature-logo.jpg'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for the Accuracy/Update Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // 1. Theme and Auth Logic
  useEffect(() => {
    const applyTheme = () => {
      const savedSettings = localStorage.getItem('retailLeadsSettings');
      if (savedSettings) {
        const { theme } = JSON.parse(savedSettings);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.className = 'bg-gray-900 transition-colors duration-300';
        } else {
          document.documentElement.classList.remove('dark');
          document.body.className = 'bg-gray-50 transition-colors duration-300';
        }
      }
    };

    const token = localStorage.getItem('omniLeadToken');
    const user = localStorage.getItem('omniLeadUser');
    
    if (token && user) {
      setUserData({ token, user: JSON.parse(user) });
      setIsLoggedIn(true);
    }
    
    applyTheme();
    setLoading(false);
  }, [isLoggedIn]);

  // 2. NEW: Check if Model needs update (Simulating a check)
  useEffect(() => {
    if (isLoggedIn) {
      // Logic: If accuracy is low or data is old, show the popup
      // In a real app, this value would come from your Backend API
      const modelStatus = { accuracy: 0.68, needsUpdate: true }; 

      if (modelStatus.needsUpdate) {
        // Delay slightly so it doesn't pop up the split second the page loads
        const timer = setTimeout(() => setShowUpdateModal(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn]);

  const handleLogin = (data) => {
    setUserData(data);
    setIsLoggedIn(true);
    localStorage.setItem('omniLeadToken', data.token);
    localStorage.setItem('omniLeadUser', JSON.stringify(data.user));
  };

  const handleLogout = () => {
    setUserData(null);
    setIsLoggedIn(false);
    localStorage.removeItem('omniLeadToken');
    localStorage.removeItem('omniLeadUser');
    document.documentElement.classList.remove('dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <img src={logo} alt="Signature Logo" className="h-20 mb-4 animate-pulse" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        {/* SIGNATURE CUSTOM MODAL */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpdateModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700 transform transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  Intelligence Update Required
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Our AI monitors indicate that the retail dataset has shifted. To maintain high accuracy for your leads, a model refresh is recommended.
                </p>

                <div className="flex flex-col w-full space-y-3">
                  <button 
                    onClick={() => {
                      setShowUpdateModal(false);
                      window.location.href = '/settings';
                    }}
                    className="w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
                  >
                    Go to Settings & Update
                  </button>
                  <button 
                    onClick={() => setShowUpdateModal(false)}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Remind me later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
          
          <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} logo={logo} />} />
          
          <Route path="/dashboard" element={isLoggedIn ? (
            <>
              <Header onLogout={handleLogout} user={userData?.user} logo={logo} />
              <LeadDashboard userData={userData} />
            </>
          ) : <Navigate to="/login" replace />} />
          
          <Route path="/leads" element={isLoggedIn ? (
            <>
              <Header onLogout={handleLogout} user={userData?.user} logo={logo} />
              <LeadsPage />
            </>
          ) : <Navigate to="/login" replace />} />
          
          <Route path="/settings" element={isLoggedIn ? (
            <>
              <Header onLogout={handleLogout} user={userData?.user} logo={logo} />
              <Settings />
            </>
          ) : <Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;