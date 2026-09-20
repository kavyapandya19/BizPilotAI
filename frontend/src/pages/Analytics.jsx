import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, BarChart2 } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

const RANGES = ['7d', '30d', '90d'];
const RANGE_LABELS = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel px-4 py-3 rounded-xl text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : `${p.value} orders`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [range, setRange] = useState('7d');
  const [revenueData, setRevenueData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [rv, ch, tp, kpi] = await Promise.all([
        analyticsService.getRevenueChart(range),
        analyticsService.getSalesByChannel(),
        analyticsService.getTopProducts(),
        analyticsService.getSummaryKPIs(),
      ]);
      if (rv.success) setRevenueData(rv.data);
      if (ch.success) setChannelData(ch.data);
      if (tp.success) setTopProducts(tp.data);
      if (kpi.success) setKpis(kpi.data);
      setLoading(false);
    };
    fetchAll();
  }, [range]);

  const kpiCards = kpis ? [
    { label: 'Total Revenue', value: kpis.totalRevenue, change: kpis.revenueChange, positive: true, icon: DollarSign, color: 'text-brand-400', bg: 'bg-brand-400/10' },
    { label: 'Total Orders', value: kpis.totalOrders, change: kpis.ordersChange, positive: false, icon: ShoppingBag, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Avg Order Value', value: kpis.avgOrderValue, change: kpis.aovChange, positive: true, icon: BarChart2, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Revenue Growth', value: kpis.revenueGrowth, change: kpis.growthChange, positive: true, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ] : [];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Deep dive into your business performance.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                range === r
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
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
                  kpi.positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
                }`}>{kpi.change}</span>
              </div>
              <p className="text-slate-400 text-xs font-medium">{kpi.label}</p>
              <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
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
