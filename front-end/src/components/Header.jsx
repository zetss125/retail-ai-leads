import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Header({ onLogout, user, logo }) {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {/* BRAND LOGO */}
              <img 
                src={logo} 
                alt="Signature Logo" 
                className="h-12 w-auto object-contain mix-blend-multiply" 
              />
              <div className="ml-3 flex flex-col">
                <h1 className="text-xl font-serif font-bold text-gray-900 leading-tight tracking-widest uppercase">
                  Signature
                </h1>
                <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                  Elegance in every wave
                </span>
              </div>
            </div>
            
            <nav className="ml-10 flex space-x-4">
              <NavLink 
                to="/dashboard"
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/leads"
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                Leads
              </NavLink>
              {/* NEW SETTINGS LINK */}
              <NavLink 
                to="/settings"
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                Settings
              </NavLink>
            </nav>
          </div>
          
          <div className="flex items-center">
            <div className="mr-6 text-sm text-gray-600 italic">
              Logged in as <span className="font-semibold text-gray-900">{user?.name || 'Admin'}</span>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all focus:outline-none"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}