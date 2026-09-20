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
        <h2 className="text-lg font-semibold text-white mb-6">Revenue & Orders Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 6, fill: '#0ea5e9' }} />
            <Area type="monotone" dataKey="orders" name="orders" stroke="#818cf8" strokeWidth={2} fill="url(#colorOrders)" dot={false} activeDot={{ r: 6, fill: '#818cf8' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Channel + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Sales by Channel</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {channelData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Top Products by Revenue</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
