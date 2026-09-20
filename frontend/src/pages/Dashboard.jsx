import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, ShoppingCart, Activity, Download, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { inventoryService } from '../services/inventoryService';
import { customerService } from '../services/customerService';
import LoadingScreen from '../components/common/LoadingScreen';

const Dashboard = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
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
  const kpis = kpiQuery.data?.data || [];
  const insights = [];

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
        <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs">
          <p className="text-slate-400 mb-0.5">{label}</p>
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, insightsRes] = await Promise.all([
          dashboardService.getKPIs(),
          dashboardService.getAgentInsights()
        ]);

        if (kpiRes.success) setKpis(kpiRes.data);
        if (insightsRes.success) setInsights(insightsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#dashRevGrad)" dot={false} activeDot={{ r: 5, fill: '#0ea5e9' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div >

        {/* AI Agent Activity */}
        < div className="glass-card p-6 flex flex-col" >
          <h2 className="text-lg font-semibold text-slate-900 mb-6">AI Agent Insights</h2>
          <div className="flex-1 space-y-4">

            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-xl border ${insight.type === 'alert'
                  ? 'bg-brand-50 border-brand-200'
                  : 'bg-slate-50 border-slate-200'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${insight.type === 'alert' ? 'bg-brand-500' : 'bg-emerald-500'}`}></div>
                  <span className={`text-sm font-medium ${insight.type === 'alert' ? 'text-brand-700' : 'text-emerald-700'}`}>
                    {insight.title}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  "{insight.message}"
                </p>
                {insight.actionText && (
                  <div className="mt-3">
                    <button className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition">
                      {insight.actionText}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {insights.length === 0 && (
              <div className="text-slate-500 text-sm text-center py-4">No recent insights from the agent.</div>
            )}

          </div>
        </div >

      </div >
    </div >
  );
};

export default Dashboard;
