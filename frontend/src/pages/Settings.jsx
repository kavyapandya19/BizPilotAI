import React, { useState, useEffect, useContext } from 'react';
import {
  User,
  Building2,
  Shield,
  Bell,
  Plug,
  Save,
  Check,
  Database,
  RefreshCw,
  AlertCircle,
  Server,
  Download,
  Zap,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { customerService } from '../services/customerService';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'database', label: 'Database', icon: Database },
];

const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label}
    </label>

    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input-field text-sm"
    />

    {hint && (
      <p className="mt-1.5 text-xs text-slate-500">
        {hint}
      </p>
    )}
  </div>
);

const ToggleSwitch = ({
  label,
  description,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-700/30 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-200">
        {label}
      </p>

      <p className="text-xs text-slate-500 mt-0.5">
        {description}
      </p>
    </div>

    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-500' : 'bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const IntegrationCard = ({
  name,
  description,
  logo,
  connected,
}) => (
  <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-lg">
        {logo}
      </div>

      <div>
        <p className="text-sm font-medium text-white">
          {name}
        </p>

        <p className="text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>

    <button
      type="button"
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
        connected
          ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20'
          : 'text-slate-300 bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
      }`}
    >
      {connected ? '✓ Connected' : 'Connect'}
    </button>
  </div>
);

const Settings = () => {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  // Business state
  const [bizName, setBizName] = useState('');
  const [industry, setIndustry] = useState('');
  const [timezone, setTimezone] = useState('UTC+5:30 - Asia/Kolkata');
  const [currency, setCurrency] = useState('INR (₹)');

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

  // Database state
  const [dbStatus, setDbStatus] = useState(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // n8n Integration state
  const [n8nStatus, setN8nStatus] = useState(null);
  const [isTestingN8n, setIsTestingN8n] = useState(false);
  const [n8nTestResult, setN8nTestResult] = useState(null);
  const [copiedN8nUrl, setCopiedN8nUrl] = useState(false);

  // Load authenticated user data
  useEffect(() => {
    if (!user) return;

    setName(user.name || '');
    setEmail(user.email || '');
    setRole(user.role || '');

    setBizName(user.business?.name || '');
    setIndustry(user.business?.industry || '');

    if (user.business?.timezone) {
      setTimezone(user.business.timezone);
    }

    if (user.business?.currency) {
      setCurrency(user.business.currency);
    }
  }, [user]);

  const checkDbStatus = async () => {
    setIsCheckingDb(true);

    try {
      const res = await fetch('/api/health');
      const data = await res.json();

      setDbStatus(
        data.database || {
          connected: false,
          error: 'No response from API',
        }
      );
    } catch (err) {
      setDbStatus({
        connected: false,
        error: err.message,
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const reconnectDb = async () => {
    setIsCheckingDb(true);

    try {
      const res = await fetch('/api/db-reconnect', {
        method: 'POST',
      });

      const data = await res.json();

      setDbStatus(
        data.data || {
          connected: false,
        }
      );
    } catch (err) {
      setDbStatus({
        connected: false,
        error: err.message,
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const checkN8nStatus = async () => {
    try {
      const res = await customerService.getN8nStatus();

      if (res?.success) {
        setN8nStatus(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch n8n status:', err);
    }
  };

  const handleTestN8n = async () => {
    setIsTestingN8n(true);
    setN8nTestResult(null);

    try {
      const res = await customerService.testN8nWebhook();

      setN8nTestResult(
        res?.data || {
          success: false,
          message: 'No response from n8n test endpoint',
        }
      );
    } catch (err) {
      setN8nTestResult({
        success: false,
        message: err.message,
      });
    } finally {
      setIsTestingN8n(false);
    }
  };

  const handleCopyN8nUrl = () => {
    const url =
      n8nStatus?.webhookUrl ||
      'http://localhost:5678/webhook/bizpilot-churn-retention';

    navigator.clipboard?.writeText(url);

    setCopiedN8nUrl(true);

    setTimeout(() => {
      setCopiedN8nUrl(false);
    }, 2000);
  };

  useEffect(() => {
    if (activeTab === 'database') {
      checkDbStatus();
    }

    if (activeTab === 'integrations') {
      checkN8nStatus();
    }
  }, [activeTab]);

  const handleSave = () => {
    // Keep this as UI-only until backend settings update endpoints exist.
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-5 pb-6 border-b border-slate-700/50">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div>
                <p className="text-white font-semibold text-lg">
                  {name || 'User'}
                </p>

                <p className="text-slate-400 text-sm">
                  {email}
                </p>

                <button
                  type="button"
                  className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Change avatar
                </button>
              </div>
            </div>

            <InputField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />

            <InputField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field text-sm"
              >
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
            <InputField
              label="Business Name"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              placeholder="Your company name"
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Industry
              </label>

              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input-field text-sm"
              >
                {[
                  'Technology',
                  'Retail',
                  'E-Commerce',
                  'Healthcare',
                  'Finance',
                  'Manufacturing',
                  'Other',
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Timezone
              </label>

              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input-field text-sm"
              >
                {[
                  'UTC+0:00 - London',
                  'UTC+5:30 - Asia/Kolkata',
                  'UTC-5:00 - New York',
                  'UTC-8:00 - Los Angeles',
                  'UTC+1:00 - Paris',
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Currency
              </label>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field text-sm"
              >
                {[
                  'INR (₹)',
                  'USD ($)',
                  'EUR (€)',
                  'GBP (£)',
                  'JPY (¥)',
                  'AED (د.إ)',
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-5">
            <div className="p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl">
              <p className="text-sm text-slate-300">
                🔒 Your account uses a secure authentication system.
                Change your password below.
              </p>
            </div>

            <InputField
              label="Current Password"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
            />

            <InputField
              label="New Password"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
              hint="Minimum 8 characters, include a number and symbol."
            />

            <InputField
              label="Confirm New Password"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
            />

            <div className="pt-2 border-t border-slate-700/50">
              <p className="text-sm font-semibold text-slate-200 mb-3">
                Two-Factor Authentication
              </p>

              <p className="text-sm text-slate-400 mb-3">
                Add an extra layer of security to your account by enabling 2FA.
              </p>

              <button
                type="button"
                className="btn-secondary text-sm py-2"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <p className="text-sm text-slate-400 mb-6">
              Choose which alerts and reports the AI agent sends to you.
            </p>

            <ToggleSwitch
              label="Inventory Alerts"
              description="Get notified when stock levels are critically low."
              checked={notifs.inventoryAlerts}
              onChange={(v) =>
                setNotifs({
                  ...notifs,
                  inventoryAlerts: v,
                })
              }
            />

            <ToggleSwitch
              label="High Churn Risk Customers"
              description="Alert when a customer's churn risk exceeds 70%."
              checked={notifs.churnRisk}
              onChange={(v) =>
                setNotifs({
                  ...notifs,
                  churnRisk: v,
                })
              }
            />

            <ToggleSwitch
              label="Daily Revenue Reports"
              description="Receive a daily summary of revenue and orders."
              checked={notifs.revenueReports}
              onChange={(v) =>
                setNotifs({
                  ...notifs,
                  revenueReports: v,
                })
              }
            />

            <ToggleSwitch
              label="AI Agent Actions"
              description="Get notified when the agent performs an autonomous action."
              checked={notifs.agentActions}
              onChange={(v) =>
                setNotifs({
                  ...notifs,
                  agentActions: v,
                })
              }
            />

            <ToggleSwitch
              label="Weekly Business Digest"
              description="A comprehensive weekly summary of all key metrics."
              checked={notifs.weeklyDigest}
              onChange={(v) =>
                setNotifs({
                  ...notifs,
                  weeklyDigest: v,
                })
              }
            />
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-400 mb-4">
                Connect BizPilot AI with your automation workflows and
                third-party platforms.
              </p>
            </div>

            {/* n8n Churn Automation Workflow */}
            <div className="p-5 rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg text-2xl">
                    ⚡
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        n8n Churn Win-Back Automation
                      </h3>

                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Webhook Trigger
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      Autonomous event pipeline dispatching rich RFM churn
                      profiles and personalized incentives.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTestN8n}
                    disabled={isTestingN8n}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isTestingN8n
                          ? 'animate-spin text-brand-400'
                          : ''
                      }`}
                    />

                    <span>
                      {isTestingN8n
                        ? 'Pinging n8n...'
                        : 'Test Webhook'}
                    </span>
                  </button>

                  <a
                    href="/api/integrations/n8n/download-workflow"
                    download="bizpilot-churn-workflow.json"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Workflow JSON</span>
                  </a>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                    Target Webhook Endpoint
                  </p>

                  <code className="text-xs text-brand-300 font-mono break-all">
                    {n8nStatus?.webhookUrl ||
                      'http://localhost:5678/webhook/bizpilot-churn-retention'}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={handleCopyN8nUrl}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
                >
                  <Copy className="w-3 h-3" />

                  <span>
                    {copiedN8nUrl ? 'Copied!' : 'Copy URL'}
                  </span>
                </button>
              </div>

              {/* Test feedback */}
              {n8nTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    n8nTestResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {n8nTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1">
                    <p className="font-semibold">
                      {n8nTestResult.success
                        ? 'n8n Webhook Active & Verified'
                        : 'n8n Connectivity Diagnostic'}
                    </p>

                    <p className="text-[11px] opacity-90">
                      {n8nTestResult.message}
                    </p>

                    {n8nTestResult.error && (
                      <p className="font-mono text-[10px] text-slate-400 mt-1">
                        {n8nTestResult.error}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Setup guide */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs text-slate-400">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand-400" />
                  Quick n8n Setup in 3 Steps:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-brand-400">
                      1. Import Workflow
                    </span>

                    <p className="text-[11px]">
                      Click "Download Workflow JSON" and import it directly
                      into your n8n workspace.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-brand-400">
                      2. Configure SMTP
                    </span>

                    <p className="text-[11px]">
                      Set your Gmail, SendGrid, Mailgun, or corporate SMTP
                      credentials on the Email node.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-brand-400">
                      3. Activate Workflow
                    </span>

                    <p className="text-[11px]">
                      Toggle the workflow "Active" in n8n. BizPilot AI sends
                      retention emails automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Other integrations */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Connected Services
              </h4>

              <IntegrationCard
                name="Shopify"
                description="Sync orders and inventory automatically"
                logo="🛍️"
                connected
              />

              <IntegrationCard
                name="Stripe"
                description="Pull real-time payment and revenue data"
                logo="💳"
                connected
              />

              <IntegrationCard
                name="Mailchimp"
                description="Trigger email campaigns based on AI insights"
                logo="📧"
                connected={false}
              />

              <IntegrationCard
                name="QuickBooks"
                description="Sync financial records and invoices"
                logo="📊"
                connected={false}
              />

              <IntegrationCard
                name="Slack"
                description="Receive AI alerts directly in your Slack workspace"
                logo="💬"
                connected={false}
              />
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            {/* Live DB Connection */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                dbStatus?.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-3 rounded-xl ${
                      dbStatus?.connected
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    <Database className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        MongoDB Database
                      </h3>

                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          dbStatus?.connected
                            ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                            : 'bg-rose-400/20 text-rose-400 border border-rose-400/30'
                        }`}
                      >
                        {dbStatus?.connected
                          ? '● Connected'
                          : '○ Disconnected'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {dbStatus?.connected
                        ? `Connected to host: ${
                            dbStatus.host || 'localhost'
                          }`
                        : 'Local MongoDB service is not running on port 27017.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={checkDbStatus}
                    disabled={isCheckingDb}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isCheckingDb ? 'animate-spin' : ''
                      }`}
                    />

                    Test Connection
                  </button>

                  <button
                    type="button"
                    onClick={reconnectDb}
                    disabled={isCheckingDb}
                    className="btn-primary text-xs py-2 px-3.5"
                  >
                    Retry Connect
                  </button>
                </div>
              </div>

              {dbStatus?.error && (
                <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />

                  <div>
                    <span className="text-rose-400 font-semibold">
                      Diagnostic:{' '}
                    </span>

                    <span>{dbStatus.error}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Connection details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <p className="text-xs text-slate-400">
                  Target Database URI
                </p>

                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm text-brand-300 font-mono truncate">
                    {dbStatus?.uri ||
                      'mongodb://localhost:27017/bizpilot'}
                  </code>
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <p className="text-xs text-slate-400">
                  Operating Mode
                </p>

                <p className="text-sm font-medium text-white mt-1">
                  {dbStatus?.connected
                    ? 'Live Database (Mongoose)'
                    : 'Resilient Standalone / Scaffold Mode'}
                </p>
              </div>
            </div>

            {/* Connection guide */}
            <div className="p-5 bg-slate-800/20 border border-slate-700/40 rounded-2xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-400" />
                How to Connect Database
              </h4>

              <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <p className="font-semibold text-slate-300 mb-1">
                    Option A: Start Local MongoDB (Windows)
                  </p>

                  <p>
                    If MongoDB Community Server is installed on this PC,
                    start the service in PowerShell:
                  </p>

                  <pre className="mt-2 p-2 bg-black/40 rounded border border-slate-800 text-brand-300 font-mono">
                    net start MongoDB
                  </pre>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <p className="font-semibold text-slate-300 mb-1">
                    Option B: Free MongoDB Atlas Cloud Database
                  </p>

                  <p>
                    1. Create a free cluster on{' '}
                    <span className="text-brand-400 font-medium">
                      mongodb.com/atlas
                    </span>
                    .
                  </p>

                  <p>
                    2. Copy your connection string and add it to{' '}
                    <code className="text-white">
                      backend/.env
                    </code>
                    :
                  </p>

                  <pre className="mt-2 p-2 bg-black/40 rounded border border-slate-800 text-brand-300 font-mono">
                    MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/bizpilot
                  </pre>

                  <p className="mt-2">
                    3. The backend will automatically reconnect without
                    needing a restart.
                  </p>
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
        <h1 className="text-2xl font-bold text-slate-900">
          Settings
        </h1>

        <p className="text-slate-500 mt-1">
          Manage your account, business, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab sidebar */}
        <div className="glass-card p-3 h-fit">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
            {TABS.find((tab) => tab.id === activeTab)?.label} Settings
          </h2>

          {renderContent()}

          {/* Save button */}
          {activeTab !== 'database' && (
            <div className="mt-8 pt-5 border-t border-slate-700/50 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                  saved
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'btn-primary'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
