import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, DollarSign, BarChart2 } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import LoadingScreen from '../components/common/LoadingScreen';

const Analytics = () => {
  const kpiQuery = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardService.getKPIs,
    staleTime: 2 * 60 * 1000,
  });
  const kpiCards = (kpiQuery.data?.data || []).map((kpi) => ({
    label: kpi.title,
    value: kpi.value,
    change: kpi.change,
    positive: kpi.isPositive,
    icon: kpi.title.includes('Revenue') ? DollarSign : kpi.title.includes('Orders') ? ShoppingBag : kpi.title.includes('Customers') ? TrendingUp : BarChart2,
    color: kpi.title.includes('Revenue') ? 'text-brand-600' : kpi.title.includes('Orders') ? 'text-orange-600' : kpi.title.includes('Customers') ? 'text-emerald-600' : 'text-indigo-600',
    bg: kpi.title.includes('Revenue') ? 'bg-brand-100' : kpi.title.includes('Orders') ? 'bg-orange-100' : kpi.title.includes('Customers') ? 'bg-emerald-100' : 'bg-indigo-100',
  }));

  if (kpiQuery.isPending && !kpiQuery.data) {
    return <LoadingScreen label="Crunching your business data..." />;
  }

  if (kpiQuery.isError) {
    return <div className="p-8 text-center text-rose-700">Unable to load analytics KPIs. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Deep dive into your business performance.</p>
        </div>
        {kpiQuery.isFetching && <span className="text-xs text-slate-400">Refreshing KPI data...</span>}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  kpi.positive ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                }`}>{kpi.change}</span>
              </div>
              <p className="text-slate-500 text-xs font-medium">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Revenue & Orders Over Time</h2>
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
          Revenue history is not available from the backend yet.
        </div>
      </div>

      {/* Bottom row: Channel + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Sales by Channel</h2>
          <div className="flex items-center gap-6">
            <div className="flex h-[200px] w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
              Channel data is not available from the backend yet.
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Top Products by Revenue</h2>
          <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
            Product revenue data is not available from the backend yet.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
