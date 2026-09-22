import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, ShoppingCart, Activity, Download, CheckCircle, X, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { inventoryService } from '../services/inventoryService';
import { customerService } from '../services/customerService';
import LoadingScreen from '../components/common/LoadingScreen';

const renderInsightLine = (line) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => (
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  ));
};

const Dashboard = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedInsight, setSelectedInsight] = useState(null);
  const queryClient = useQueryClient();
  const kpiQuery = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.getKPIs,
    staleTime: 2 * 60 * 1000,
  });
  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.getInventory,
    staleTime: 2 * 60 * 1000,
  });
  const customerQuery = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
    staleTime: 2 * 60 * 1000,
  });
  const insightsQuery = useQuery({
    queryKey: ['ai-insights'],
    queryFn: dashboardService.getAIInsights,
    staleTime: 30 * 1000,
  });
  const kpis = kpiQuery.data?.data || [];
  const insights = insightsQuery.data?.data || [];

  const REVENUE_SPARKLINE = [
    { date: 'Sep 14', revenue: 3200 },
    { date: 'Sep 15', revenue: 4100 },
    { date: 'Sep 16', revenue: 3800 },
    { date: 'Sep 17', revenue: 5200 },
    { date: 'Sep 18', revenue: 4700 },
    { date: 'Sep 19', revenue: 6100 },
    { date: 'Sep 20', revenue: 5800 },
  ];

  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel px-3 py-2 rounded-xl text-xs">
          <p className="text-slate-500 mb-0.5">{label}</p>
          <p className="text-brand-400 font-bold">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const deleteInsight = async (event, insight) => {
    event.stopPropagation();
    const insightId = insight._id || insight.id;
    if (!insightId) return;

    try {
      await dashboardService.deleteAIInsight(insightId);
      queryClient.setQueryData(['ai-insights'], (current) => ({
        ...(current || { success: true }),
        data: (current?.data || []).filter((item) => (item._id || item.id) !== insightId),
      }));
      if ((selectedInsight?._id || selectedInsight?.id) === insightId) {
        setSelectedInsight(null);
      }
    } catch (deleteError) {
      showToast('Could not remove this saved insight.');
      console.warn('[BizPilot Dashboard] Could not delete saved insight:', deleteError.message);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    showToast("Compiling business report...");

    try {
      // Fetch latest inventory & customer data to compile comprehensive report
      const [invRes, custRes] = await Promise.all([
        inventoryService.getInventory().catch(() => ({ data: [] })),
        customerService.getCustomers().catch(() => ({ data: [] })),
      ]);

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString();

      const csvRows = [
        ['BIZPILOT AI - EXECUTIVE BUSINESS INTELLIGENCE REPORT'],
        ['Generated On', `${dateStr} ${timeStr}`],
        ['Currency', 'INR (₹)'],
        ['Business Health Score', '88 / 100 (Strong)'],
        [],
        ['=== KEY PERFORMANCE INDICATORS ==='],
        ['Metric', 'Current Value', 'Growth / Trend', 'Status'],
        ...kpis.map((k) => [k.title, `"${k.value}"`, k.change, k.isPositive ? 'Positive' : 'Attention']),
        [],
        ['=== 7-DAY REVENUE VELOCITY ==='],
        ['Date', 'Revenue (INR)', 'Estimated Orders'],
        ...REVENUE_SPARKLINE.map((d) => [d.date, `₹${d.revenue.toLocaleString()}`, Math.round(d.revenue / 103)]),
        [],
        ['=== INVENTORY HEALTH & RESTOCK ALERTS ==='],
        ['SKU', 'Product Name', 'Category', 'Current Stock', 'Reorder Level', 'Stock Status', 'Unit Price'],
        ...(invRes.data || []).map((item) => [
          item.sku,
          `"${item.name}"`,
          item.category,
          item.currentStock,
          item.reorderLevel,
          item.status,
          `₹${item.price}`,
        ]),
        [],
        ['=== CUSTOMER RETENTION & CHURN WATCHLIST ==='],
        ['Customer Name', 'Email', 'Segment', 'LTV (INR)', 'Churn Risk %', 'Risk Level'],
        ...(custRes.data || []).map((c) => [
          `"${c.name}"`,
          c.email,
          c.segment,
          `₹${c.ltv.toLocaleString()}`,
          `${c.churnRisk}%`,
          c.churnRisk >= 70 ? 'CRITICAL RISK' : c.churnRisk >= 30 ? 'Moderate' : 'Healthy',
        ]),
        [],
        ['=== AI AUTONOMOUS AGENT RECOMMENDATIONS ==='],
        ['Priority', 'Area', 'Observation', 'Action Plan'],
        ['High', 'Inventory', 'SKU-192 Smart Watch S3 is at 8 units (below threshold 15)', 'Approve Purchase Order #PO-2026-089 for 50 units'],
        ['High', 'Inventory', '3 products out of stock (4K Webcam, Laptop Stand, SSD 1TB)', 'Expedite vendor replenishment with Premier Logistics'],
        ['High', 'Customer Retention', 'Priya Sharma (81% churn risk) and David Kim (LTV ₹31,500) inactive', 'Dispatch automated VIP win-back campaign with 15% incentive'],
        ['Medium', 'Sales Growth', 'Thursday peak revenue (₹6,100), Enterprise 52% of sales', 'Schedule midweek enterprise promotions to scale AOV'],
      ];

      const csvContent = csvRows.map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BizPilot_Business_Report_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      showToast(`✅ BizPilot_Business_Report_${dateStr}.csv downloaded successfully!`);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setIsGenerating(false);
      showToast('❌ Failed to download report. Please try again.');
    }
  };

  const getIconForTitle = (title) => {
    if (title.includes('Revenue')) return DollarSign;
    if (title.includes('Customers')) return Users;
    if (title.includes('Orders')) return ShoppingCart;
    return Activity;
  };

  const getColorForTitle = (title) => {
    if (title.includes('Revenue')) return { text: 'text-brand-600', bg: 'bg-brand-100' };
    if (title.includes('Customers')) return { text: 'text-indigo-600', bg: 'bg-indigo-100' };
    if (title.includes('Orders')) return { text: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-100' };
  };

  if (kpiQuery.isPending && !kpiQuery.data) {
    return <LoadingScreen label="Preparing your dashboard..." />;
  }

  if (kpiQuery.isError) {
    return <div className="p-8 text-center text-rose-700">Unable to load dashboard KPIs. Please try again.</div>;
  }

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 glass-panel px-5 py-3 rounded-xl text-sm text-white border border-brand-500/30 bg-brand-500/10 shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Here is what's happening with your business today.</p>
        </div >
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4 disabled:opacity-50 transition-all shadow-lg hover:shadow-brand-500/20"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Downloading CSV...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate Report</span>
            </>
          )}
        </button>
      </div >

      {/* KPI Cards */}
      < div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" >
        {
          kpis.map((kpi, index) => {
            const Icon = getIconForTitle(kpi.title);
            const colors = getColorForTitle(kpi.title);

            return (
              <div key={index} className="glass-card p-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg 
                  ${kpi.isPositive ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                    }`}>
                    {kpi.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {kpi.change}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-slate-500 font-medium">{kpi.title}</h3>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                </div >
              </div >
            );
          })}
      </div >

      {/* Main Content Area Grid */}
      < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >

        {/* Revenue Chart */}
        < div className="glass-card p-6 lg:col-span-2 flex flex-col" >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 days</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg text-emerald-700 bg-emerald-100">+12.5% this week</span>
          </div >
          <div className="flex-1" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_SPARKLINE} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#dashRevGrad)" dot={false} activeDot={{ r: 5, fill: 'var(--primary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div >

        {/* AI Agent Activity */}
        < div className="glass-card p-6 flex flex-col" >
          <h2 className="text-lg font-semibold text-slate-900 mb-6">AI Agent Insights</h2>
          <div className="max-h-[430px] flex-1 space-y-4 overflow-y-auto pr-2">

            {insights.map((insight) => (
              <div
                key={insight._id || insight.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedInsight(insight)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedInsight(insight);
                  }
                }}
                className="relative p-4 rounded-xl border bg-brand-50 border-brand-200 cursor-pointer transition hover:border-brand-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                  <span className="min-w-0 flex-1 text-sm font-medium text-brand-700 truncate">
                    {insight.question}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => deleteInsight(event, insight)}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                    aria-label={`Remove saved insight: ${insight.question}`}
                    title="Remove saved insight"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-5">
                  {insight.answer}
                </p>
                <p className="text-[11px] text-slate-400 mt-3">
                  {new Date(insight.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            ))}

            {insightsQuery.isPending && (
              <div className="text-slate-500 text-sm text-center py-4">Loading saved AI insights...</div>
            )}

            {!insightsQuery.isPending && insights.length === 0 && (
              <div className="text-slate-500 text-sm text-center py-4">Ask the AI Assistant a question to see saved insights here.</div>
            )}

          </div>
        </div >

      </div >

      {selectedInsight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setSelectedInsight(null)}
        >
          <div
            className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="insight-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Saved AI insight</p>
                <h2 id="insight-detail-title" className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedInsight.question}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInsight(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close insight details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(85vh-130px)] overflow-y-auto px-6 py-6 text-sm leading-7 text-slate-700">
              {selectedInsight.answer.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {renderInsightLine(line)}
                  {index < selectedInsight.answer.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
            <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-400">
              {new Date(selectedInsight.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Dashboard;
