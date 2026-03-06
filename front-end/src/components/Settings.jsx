import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    leadThreshold: 60,
    autoExport: false,
    theme: 'light',
    apiKey: '',
    serviceArea: ['New York', 'Chicago', 'Los Angeles']
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newCity, setNewCity] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('retailLeadsSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setMessage('');
    
    setTimeout(() => {
      localStorage.setItem('retailLeadsSettings', JSON.stringify(settings));
      
      // INSTANT THEME UPDATE
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.className = 'bg-gray-900';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.className = 'bg-gray-50';
      }

      setSaving(false);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 500);
  };

  const handleReset = () => {
    const defaultSettings = {
      notifications: true,
      emailAlerts: true,
      smsAlerts: false,
      leadThreshold: 60,
      autoExport: false,
      theme: 'light',
      apiKey: '',
      serviceArea: ['New York', 'Chicago', 'Los Angeles']
    };
    setSettings(defaultSettings);
    setMessage('Settings reset to defaults');
    setTimeout(() => setMessage(''), 3000);
  };

  const addCity = () => {
    if (newCity.trim() && !settings.serviceArea.includes(newCity.trim())) {
      setSettings({
        ...settings,
        serviceArea: [...settings.serviceArea, newCity.trim()]
      });
      setNewCity('');
    }
  };

  const removeCity = (city) => {
    setSettings({
      ...settings,
      serviceArea: settings.serviceArea.filter(c => c !== city)
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Retail AI Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure your preferences and workspace theme.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900 dark:border-green-800">
          <span className="text-green-700 dark:text-green-200 font-medium">{message}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-transparent dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🎨 Workspace Theme</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setSettings({...settings, theme: 'light'})}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                settings.theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-400 mr-3 shadow-sm"></div>
                <div className="text-left">
                  <div className="font-medium dark:text-white">Light Mode</div>
                  <div className="text-sm text-gray-500">Standard view</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setSettings({...settings, theme: 'dark'})}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                settings.theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-600 mr-3 shadow-sm"></div>
                <div className="text-left">
                  <div className="font-medium dark:text-white">Dark Mode</div>
                  <div className="text-sm text-gray-500">Easier on eyes</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Lead Threshold Section */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-transparent dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">🎯 Scoring Threshold</h2>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.leadThreshold}
            onChange={(e) => setSettings({...settings, leadThreshold: parseInt(e.target.value)})}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Threshold: <span className="font-bold text-blue-600">{settings.leadThreshold}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Reset Defaults
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}