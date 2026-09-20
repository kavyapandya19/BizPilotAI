import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, ShoppingCart, Activity, Download, CheckCircle } from 'lucide-react';
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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const generateReport = async () => {
    setIsGenerating(true);
    showToast("Compiling business report...");

    try {
      // Fetch latest inventory & customer data to compile comprehensive report
      const invRes = inventoryQuery.data || { data: [] };
      const custRes = customerQuery.data || { data: [] };

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString();

      const csvRows = [
        ['BIZPILOT AI - EXECUTIVE BUSINESS INTELLIGENCE REPORT'],
        ['Generated On', `${dateStr} ${timeStr}`],
        ['Currency', 'INR (₹)'],
        [],
        ['=== KEY PERFORMANCE INDICATORS ==='],
        ['Metric', 'Current Value', 'Growth / Trend', 'Status'],
        ...kpis.map((k) => [k.title, `"${k.value}"`, k.change, k.isPositive ? 'Positive' : 'Attention']),
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
        <div className="fixed top-6 right-6 z-50 bg-brand-50 px-5 py-3 rounded-xl text-sm text-brand-800 border border-brand-200 shadow-xl animate-bounce font-medium">
          {toastMsg}
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Here is what's happening with your business today.</p>
        </div>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = getIconForTitle(kpi.title);
          const colors = getColorForTitle(kpi.title);
          
          return (
            <div key={index} className="glass-card p-6">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
                  kpi.isPositive ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                }`}>
                  {kpi.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {kpi.change}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-slate-500 font-medium">{kpi.title}</h3>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 days</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg text-emerald-700 bg-emerald-100">+12.5% this week</span>
          </div>
          <div className="flex-1" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                Revenue history is not available from the backend yet.
              </div>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Agent Activity */}
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">AI Agent Insights</h2>
          <div className="flex-1 space-y-4">
            
            {insights.map((insight) => (
              <div 
                key={insight.id} 
                className={`p-4 rounded-xl border ${
                  insight.type === 'alert' 
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
              <div className="text-slate-500 text-sm text-center py-4">Agent insights are not available from the backend yet.</div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
