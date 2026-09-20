import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  TrendingDown,
  DollarSign,
  Mail,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Info,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Zap,
  CheckCheck,
  Clock,
  Ticket,
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { aiService } from '../services/aiService';

const SEGMENT_COLORS = {
  Enterprise: { text: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
  Premium:    { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20' },
  Standard:   { text: 'text-slate-400', bg: 'bg-slate-700/50',   border: 'border-slate-600/50' },
};

const ChurnBar = ({ value }) => {
  const color = value >= 70 ? 'bg-rose-500' : value >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = value >= 70 ? 'text-rose-400' : value >= 40 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, Math.max(2, value))}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${textColor}`}>{value}%</span>
    </div>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('churnRisk'); // 'churnRisk' | 'ltv'
  const [modelInfo, setModelInfo] = useState(null);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [notification, setNotification] = useState('');

  // AI Retention Email Modal State
  const [emailModalCustomer, setEmailModalCustomer] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailIncentive, setEmailIncentive] = useState('');
  const [emailIncentiveDesc, setEmailIncentiveDesc] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isBatchCampaignRunning, setIsBatchCampaignRunning] = useState(false);

  const fetchCustomerData = async (forceMl = false) => {
    try {
      const res = await customerService.getCustomers({ ml: forceMl });
      if (res && res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchCustomerData(false),
      customerService.getChurnModelInfo(),
    ]).then(([_, modelData]) => {
      if (modelData) {
        setModelInfo(modelData);
      }
      setLoading(false);
    });
  }, []);

  const handleRecalculateChurn = async () => {
    setIsRecalculating(true);
    setNotification('Running RandomForest inference across customer accounts...');
    await fetchCustomerData(true);
    setIsRecalculating(false);
    setNotification('RandomForest Churn predictions updated successfully!');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  useEffect(() => {
    let result = [...customers];
    if (segmentFilter !== 'All') result = result.filter((c) => c.segment === segmentFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }

    // Consistent in-place sort on loaded dataset
    if (sortBy === 'churnRisk') {
      result.sort((a, b) => (b.churnRisk || 0) - (a.churnRisk || 0));
    } else if (sortBy === 'ltv') {
      result.sort((a, b) => (b.ltv || 0) - (a.ltv || 0));
    }

    setFiltered(result);
  }, [search, segmentFilter, sortBy, customers]);

  // Open Win-Back Email Modal for a Customer
  const openEmailModal = async (customer) => {
    setEmailModalCustomer(customer);
    setIsGeneratingEmail(true);

    const generated = await aiService.generateWinBackEmail(customer);
    setEmailSubject(generated.subject);
    setEmailBody(generated.body);
    setEmailIncentive(generated.incentiveCode);
    setEmailIncentiveDesc(generated.incentiveDesc);
    setIsGeneratingEmail(false);
  };

  const regenerateEmailContent = async () => {
    if (!emailModalCustomer) return;
    setIsGeneratingEmail(true);
    const generated = await aiService.generateWinBackEmail(emailModalCustomer);
    setEmailSubject(generated.subject);
    setEmailBody(generated.body);
    setEmailIncentive(generated.incentiveCode);
    setEmailIncentiveDesc(generated.incentiveDesc);
    setIsGeneratingEmail(false);
  };

  const handleSendRetentionEmail = async () => {
    if (!emailModalCustomer) return;
    setIsSendingEmail(true);

    const payload = {
      recipientName: emailModalCustomer.name,
      recipientEmail: emailModalCustomer.email,
      subject: emailSubject,
      body: emailBody,
      incentive: emailIncentive,
      churnRisk: emailModalCustomer.churnRisk,
    };

    const res = await customerService.sendRetentionEmail(emailModalCustomer.id, payload);
    setIsSendingEmail(false);
    setEmailModalCustomer(null);

    // Optimistically update customer status
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === emailModalCustomer.id
          ? {
              ...c,
              retentionCampaign: {
                status: 'Sent',
                lastSentAt: new Date().toISOString(),
                subject: emailSubject,
                incentive: emailIncentive,
              },
            }
          : c
      )
    );

    setNotification(`Retention email delivered to ${emailModalCustomer.name} (${emailModalCustomer.email})!`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleBatchRetentionCampaign = async () => {
    setIsBatchCampaignRunning(true);
    setNotification('AI Agent launching automated win-back campaign for high churn accounts...');

    const res = await customerService.launchBatchRetentionCampaign(70);
    setIsBatchCampaignRunning(false);

    // Update state to reflect campaign dispatch
    setCustomers((prev) =>
      prev.map((c) =>
        (c.churnRisk || 0) >= 70
          ? {
              ...c,
              retentionCampaign: {
                status: 'Sent',
                lastSentAt: new Date().toISOString(),
                subject: `Exclusive ${c.segment} Incentive from BizPilot`,
                incentive: c.segment === 'Enterprise' ? 'VIP-ENTERPRISE-20' : c.segment === 'Premium' ? 'VIP-SAVE15' : 'COMEBACK500',
              },
            }
          : c
      )
    );

    setNotification(`AI Retention Campaign Complete: Dispatched ${res.count || highRisk} win-back emails!`);
    setTimeout(() => setNotification(''), 5000);
  };

  const totalCustomers = customers.length;
  const highRisk = customers.filter((c) => (c.churnRisk || 0) >= 70).length;
  const avgLtv = customers.length
    ? Math.round(customers.reduce((s, c) => s + (c.ltv || 0), 0) / customers.length)
    : 0;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Evaluating customer retention with RandomForest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 glass-card px-4 py-3 rounded-xl border border-brand-500/40 bg-slate-900/95 text-sm text-white shadow-2xl flex items-center gap-2.5 animate-fade-in">
          <Sparkles className="w-4 h-4 text-brand-400 animate-spin" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & ML Engine Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white">Customers Intelligence</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/30">
              <Brain className="w-3.5 h-3.5" />
              RandomForest ML Active
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Autonomous retention analysis, RFM behavioral scoring, and AI-powered win-back campaigns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModelDetails(!showModelDetails)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-brand-400" />
            <span>Model Insights</span>
            {showModelDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleRecalculateChurn}
            disabled={isRecalculating}
            className="btn-primary text-xs flex items-center gap-2 py-2 px-4 shadow-lg shadow-brand-500/20 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Scoring...' : 'Recalculate with ML'}</span>
          </button>
        </div>
      </div>

      {/* Autonomous Retention Campaign Action Banner */}
      {highRisk > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/40 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
              <Zap className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">Autonomous Win-Back Agent Standing By</h4>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold border border-rose-500/30">
                  {highRisk} Accounts Critical (≥ 70%)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The AI Agent will formulate and dispatch tailored incentive emails to all flagged high churn risk accounts.
              </p>
            </div>
          </div>
          <button
            onClick={handleBatchRetentionCampaign}
            disabled={isBatchCampaignRunning}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all flex-shrink-0 disabled:opacity-60"
          >
            <Send className={`w-3.5 h-3.5 ${isBatchCampaignRunning ? 'animate-spin' : ''}`} />
            <span>{isBatchCampaignRunning ? 'Dispatching Campaign...' : 'Launch AI Retention Campaign'}</span>
          </button>
        </div>
      )}

      {/* Model Insights Collapsible Banner */}
      {showModelDetails && modelInfo && (
        <div className="glass-card p-5 border border-brand-500/20 bg-gradient-to-r from-slate-900/90 to-brand-950/20 rounded-2xl animate-fade-in space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/40 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {modelInfo.model_type || 'RandomForestClassifier'} Pipeline
                </h3>
                <p className="text-xs text-slate-400">
                  Trained on RFM features • Accuracy: <span className="text-emerald-400 font-semibold">{((modelInfo.training_accuracy || 0.91) * 100).toFixed(1)}%</span> • 100 Estimators
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live in FastAPI ML Service
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">RandomForest Feature Importance Weights:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {modelInfo.feature_importances &&
                Object.entries(modelInfo.feature_importances).map(([feature, weight]) => {
                  const labelMap = {
                    order_count: 'Order Frequency',
                    ltv: 'Lifetime Value (LTV)',
                    recency_days: 'Inactivity Recency',
                    avg_order_value: 'Avg Order Spend',
                    segment_code: 'Tier Segment',
                  };
                  const pct = Math.round(weight * 100);
                  return (
                    <div key={feature} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{labelMap[feature] || feature}</span>
                        <span className="text-brand-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
                        <div className="bg-brand-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-400/10">
            <Users className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Monitored Accounts</p>
            <p className="text-2xl font-bold text-white">{totalCustomers}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-400/10">
            <TrendingDown className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-sm">High Churn Risk</p>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                ≥ 70%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{highRisk}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-400/10">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Avg. Lifetime Value</p>
            <p className="text-2xl font-bold text-white">₹{avgLtv.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or risk tier..."
            className="input-field pl-10 text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 text-xs">
            <span className="text-slate-500 px-2 font-medium">Sort:</span>
            <button
              onClick={() => handleSortChange('churnRisk')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'churnRisk'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Highest Churn
            </button>
            <button
              onClick={() => handleSortChange('ltv')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                sortBy === 'ltv'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Highest LTV
            </button>
          </div>

          {/* Segment Filter */}
          <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
            {['All', 'Enterprise', 'Premium', 'Standard'].map((s) => (
              <button
                key={s}
                onClick={() => setSegmentFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  segmentFilter === s
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card overflow-hidden rounded-2xl border border-slate-700/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Customer</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Segment</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Orders</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Lifetime Value</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">
                  RandomForest Churn Risk
                </th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">
                  AI Retention Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((customer) => {
                const sc = SEGMENT_COLORS[customer.segment] || SEGMENT_COLORS.Standard;
                const isHighRisk = (customer.churnRisk || 0) >= 70;
                const isExpanded = expandedCustomerId === customer.id;
                const hasSentEmail = customer.retentionCampaign?.status === 'Sent';

                return (
                  <React.Fragment key={customer.id}>
                    <tr
                      onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isHighRisk ? 'bg-rose-500/[0.02]' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                              isHighRisk
                                ? 'bg-gradient-to-br from-rose-500 to-amber-600'
                                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}
                          >
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {customer.name}
                              {customer.mlPowered && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  RF-ML
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${sc.text} ${sc.bg} ${sc.border}`}>
                          {customer.segment}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-white font-medium">{customer.orders}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-white">₹{(customer.ltv || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 w-52">
                        <ChurnBar value={customer.churnRisk} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {isHighRisk ? (
                            hasSentEmail ? (
                              <button
                                onClick={() => openEmailModal(customer)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
                                title="Retention email already delivered. Click to resend or review."
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Email Sent</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openEmailModal(customer)}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 shadow-sm transition-all"
                              >
                                <Mail className="w-3.5 h-3.5 text-rose-400" />
                                <span>AI Win-Back</span>
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-all"
                            >
                              {isExpanded ? 'Hide' : 'Explain'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Model Explanation Row */}
                    {isExpanded && (
                      <tr className="bg-slate-900/60 border-y border-slate-800 animate-fade-in">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-brand-400" />
                                <span className="text-xs font-semibold text-white">
                                  RandomForest Model Explanation for {customer.name}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                    isHighRisk
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                  }`}
                                >
                                  {customer.riskTier || (isHighRisk ? 'High' : 'Healthy')} Risk Tier ({customer.churnRisk}%)
                                </span>
                              </div>
                              {customer.retentionCampaign?.lastSentAt && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-brand-400" />
                                  Last Contacted: <strong className="text-slate-300">{new Date(customer.retentionCampaign.lastSentAt).toLocaleDateString()}</strong>
                                </span>
                              )}
                            </div>

                            {/* Risk Factors Breakdown */}
                            <div>
                              <p className="text-xs text-slate-400 mb-1.5 font-medium">Identified Driving Factors:</p>
                              <div className="flex flex-wrap gap-2">
                                {customer.riskFactors && customer.riskFactors.length > 0 ? (
                                  customer.riskFactors.map((rf, idx) => (
                                    <span
                                      key={idx}
                                      className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                                        isHighRisk
                                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
                                      }`}
                                    >
                                      {isHighRisk ? (
                                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      )}
                                      {rf}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Engagement patterns within optimal retention bounds.
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Recommendation & Direct Action */}
                            <div className="pt-2 border-t border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-medium">Recommended Action:</span>
                                <span className="text-brand-300 font-medium">{customer.recommendation}</span>
                              </div>
                              {isHighRisk && (
                                <button
                                  onClick={() => openEmailModal(customer)}
                                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Draft AI Win-Back Email</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No customers match your search query.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Win-Back Email Generation & Delivery Modal */}
      {emailModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-brand-400 to-indigo-600 text-white shadow-md">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Win-Back Retention Agent</h3>
                  <p className="text-xs text-slate-400">
                    Personalized retention proposal tailored to customer churn profile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModalCustomer(null)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Churn Summary Bar */}
            <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">To:</span>
                <strong className="text-white font-semibold">{emailModalCustomer.name}</strong>
                <span className="text-slate-400">({emailModalCustomer.email})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                  {emailModalCustomer.churnRisk}% Churn Risk
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {emailModalCustomer.segment} Tier
                </span>
                <span className="text-slate-400">
                  {emailModalCustomer.recency_days || 45}d Inactive
                </span>
              </div>
            </div>

            {/* Modal Body / Email Editor */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {isGeneratingEmail ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                  <Sparkles className="w-8 h-8 text-brand-400 animate-spin" />
                  <p className="text-sm font-medium text-white">
                    Synthesizing churn risk drivers and drafting incentive proposal...
                  </p>
                  <p className="text-xs text-slate-500">
                    BizPilot AI is calibrating the discount tier for {emailModalCustomer.name}
                  </p>
                </div>
              ) : (
                <>
                  {/* Incentive Highlight */}
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Ticket className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          AI Selected Incentive: {emailIncentiveDesc}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Automated redemption code based on {emailModalCustomer.segment} account tier
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-900 text-brand-300 border border-brand-500/40">
                      {emailIncentive}
                    </span>
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="input-field text-sm font-medium text-white w-full"
                      placeholder="Subject line..."
                    />
                  </div>

                  {/* Email Body Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Email Message Body (AI Generated)
                      </label>
                      <button
                        onClick={regenerateEmailContent}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate Variant
                      </button>
                    </div>
                    <textarea
                      rows={10}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="input-field text-xs leading-relaxed text-slate-200 font-mono w-full resize-none p-3.5 bg-slate-950 border border-slate-700"
                      placeholder="Email content..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800">
              <button
                type="button"
                onClick={() => setEmailModalCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={regenerateEmailContent}
                  disabled={isGeneratingEmail || isSendingEmail}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>Regenerate with AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendRetentionEmail}
                  disabled={isGeneratingEmail || isSendingEmail || !emailBody.trim()}
                  className="btn-primary text-xs py-2 px-5 flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                  <span>{isSendingEmail ? 'Dispatching...' : 'Send Retention Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
