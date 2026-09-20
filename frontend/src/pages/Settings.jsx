import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import {
  User,
  Building2,
  Shield,
  Bell,
  Plug,
  Save,
  Database,
  RefreshCw,
  AlertCircle,
  Server,
  Sparkles,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'business',      label: 'Business',      icon: Building2 },
  { id: 'security',      label: 'Security',       icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations',  label: 'Integrations',  icon: Plug },
  { id: 'database',      label: 'Database',      icon: Database },
];

const InputField = ({ label, type = 'text', value, onChange, placeholder, hint }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input-field text-sm"
    />
    {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
  </div>
);

const ToggleSwitch = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-200 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-600' : 'bg-slate-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  </div>
);

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [saveError, setSaveError] = useState('');

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  // Business state
  const [bizName, setBizName] = useState('');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');

  // Security state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Notification toggles
  const [notifs, setNotifs] = useState({
    inventoryAlerts: true,
    churnRisk: true,
    revenueReports: false,
    agentActions: true,
    weeklyDigest: true,
  });

  // Database Connection state
  const [dbStatus, setDbStatus] = useState(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setRole(user.role || '');
    setBizName(user.business?.name || '');
    setIndustry(user.business?.industry || '');
  }, [user]);

  const checkDbStatus = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data.database || { connected: false, error: 'No response from API' });
    } catch (err) {
      setDbStatus({ connected: false, error: err.message });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const reconnectDb = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/db-reconnect', { method: 'POST' });
      const data = await res.json();
      setDbStatus(data.data || { connected: false });
    } catch (err) {
      setDbStatus({ connected: false, error: err.message });
    } finally {
      setIsCheckingDb(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'database') {
      checkDbStatus();
    }
  }, [activeTab]);

  const handleSave = () => {
    setSaveError('Settings update endpoints are not available in the backend yet.');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-5 pb-6 border-b border-slate-200">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {name.charAt(0)}
              </div>
              <div>
                <p className="text-slate-900 font-semibold text-lg">{name}</p>
                <p className="text-slate-500 text-sm">{email}</p>
                <button className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">Change avatar</button>
              </div>
            </div>
            <InputField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            <InputField label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field text-sm">
                <option>Administrator</option>
                <option>Manager</option>
                <option>Analyst</option>
                <option>Viewer</option>
              </select>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-5">
            <InputField label="Business Name" value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Your company name" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="input-field text-sm">
                {['Technology', 'Retail', 'E-Commerce', 'Healthcare', 'Finance', 'Manufacturing', 'Other'].map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input-field text-sm">
                {['UTC+0:00 - London', 'UTC+5:30 - Asia/Kolkata', 'UTC-5:00 - New York', 'UTC-8:00 - Los Angeles', 'UTC+1:00 - Paris'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field text-sm">
                {['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)', 'JPY (¥)', 'AED (د.إ)'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-5">
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
              <p className="text-sm text-brand-800">🔒 Your account uses a secure authentication system. Change your password below.</p>
            </div>
            <InputField label="Current Password" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
            <InputField label="New Password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" hint="Minimum 8 characters, include a number and symbol." />
            <InputField label="Confirm New Password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
            <div className="pt-5 mt-5 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-2">Two-Factor Authentication</p>
              <p className="text-sm text-slate-500 mb-4">Add an extra layer of security to your account by enabling 2FA.</p>
              <button className="btn-secondary text-sm py-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50">Enable 2FA</button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <p className="text-sm text-slate-500 mb-6">Choose which alerts and reports the AI agent sends to you.</p>
            <ToggleSwitch label="Inventory Alerts" description="Get notified when stock levels are critically low." checked={notifs.inventoryAlerts} onChange={(v) => setNotifs({ ...notifs, inventoryAlerts: v })} />
            <ToggleSwitch label="High Churn Risk Customers" description="Alert when a customer's churn risk exceeds 70%." checked={notifs.churnRisk} onChange={(v) => setNotifs({ ...notifs, churnRisk: v })} />
            <ToggleSwitch label="Daily Revenue Reports" description="Receive a daily summary of revenue and orders." checked={notifs.revenueReports} onChange={(v) => setNotifs({ ...notifs, revenueReports: v })} />
            <ToggleSwitch label="AI Agent Actions" description="Get notified when the agent performs an autonomous action." checked={notifs.agentActions} onChange={(v) => setNotifs({ ...notifs, agentActions: v })} />
            <ToggleSwitch label="Weekly Business Digest" description="A comprehensive weekly summary of all key metrics." checked={notifs.weeklyDigest} onChange={(v) => setNotifs({ ...notifs, weeklyDigest: v })} />
          </div>
        );

      case 'integrations':
        return (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Integration status and connection actions are not available from the backend yet.
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            {/* Live DB Connection Card */}
            <div className={`p-5 rounded-2xl border transition-all ${
              dbStatus?.connected
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl ${
                    dbStatus?.connected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">MongoDB Database</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        dbStatus?.connected
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        {dbStatus?.connected ? '● Connected' : '○ Disconnected'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {dbStatus?.connected
                        ? `Connected to host: ${dbStatus.host || 'localhost'}`
                        : 'Local MongoDB service is not running on port 27017.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={checkDbStatus}
                    disabled={isCheckingDb}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                  <button
                    onClick={reconnectDb}
                    disabled={isCheckingDb}
                    className="btn-primary text-xs py-2 px-3.5 shadow-sm"
                  >
                    Retry Connect
                  </button>
                </div>
              </div>

              {dbStatus?.error && (
                <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 font-mono flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Diagnostic: </span>
                    <span>{dbStatus.error}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Connection Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <p className="text-xs text-slate-500">Target Database URI</p>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm text-brand-600 font-mono truncate">
                    {dbStatus?.uri || 'Unavailable until the API reports connection details'}
                  </code>
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                <p className="text-xs text-slate-500">Operating Mode</p>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {dbStatus?.connected ? 'Live Database (Mongoose)' : 'Resilient Standalone / Scaffold Mode'}
                </p>
              </div>
            </div>

            {/* How to Connect Guide */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-600" />
                How to Connect Database
              </h4>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="font-semibold text-slate-900 mb-1">Option A: Start Local MongoDB (Windows)</p>
                  <p>If MongoDB Community Server is installed on this PC, start the service in PowerShell:</p>
                  <pre className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-brand-700 font-mono">net start MongoDB</pre>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <p className="font-semibold text-slate-900 mb-1">Option B: Free MongoDB Atlas Cloud Database</p>
                  <p>1. Create a free cluster on <span className="text-brand-600 font-medium">mongodb.com/atlas</span>.</p>
                  <p>2. Copy your connection string and add it to <code className="text-slate-900">backend/.env</code>:</p>
                  <pre className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-brand-700 font-mono">MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/bizpilot</pre>
                  <p className="mt-2">3. The backend will automatically reconnect without needing a restart.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account, business, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab sidebar */}
        <div className="glass-card p-3 h-fit">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content panel */}
        <div className="lg:col-span-3 glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-200">
            {TABS.find((t) => t.id === activeTab)?.label} Settings
          </h2>

          {renderContent()}

          {saveError && activeTab !== 'database' && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{saveError}</p>
          )}

          {/* Save button */}
          {activeTab !== 'database' && (
            <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shadow-md"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
