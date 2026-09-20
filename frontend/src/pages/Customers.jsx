import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingDown, DollarSign, Mail, ChevronUp, ChevronDown } from 'lucide-react';
import { customerService } from '../services/customerService';
import PaginationToolbar from '../components/common/PaginationToolbar';
import SearchField from '../components/common/SearchField';
import LoadingScreen from '../components/common/LoadingScreen';

const SEGMENT_COLORS = {
  Enterprise: { text: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  Premium:    { text: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-200' },
  Standard:   { text: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-200' },
};

const ChurnBar = ({ value }) => {
  const color = value >= 70 ? 'bg-rose-500' : value >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = value >= 70 ? 'text-rose-600' : value >= 40 ? 'text-amber-600' : 'text-emerald-600';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${textColor}`}>{value}%</span>
    </div>
  );
};

const Customers = () => {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');

  // Table State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
    staleTime: 2 * 60 * 1000,
  });
  const customers = customersQuery.data?.data || [];
  const filtered = customers.filter((customer) => {
    const matchesSegment = segmentFilter === 'All' || customer.segment === segmentFilter;
    const query = search.trim().toLowerCase();
    return matchesSegment && (!query || customer.name.toLowerCase().includes(query) || customer.email.toLowerCase().includes(query));
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = useMemo(() => {
    let sortableItems = [...filtered];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filtered, sortConfig]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCustomers = customers.length;
  const highRisk = customers.filter((c) => c.churnRisk >= 70).length;
  const avgLtv = customers.length
    ? Math.round(customers.reduce((s, c) => s + c.ltv, 0) / customers.length)
    : 0;

  if (customersQuery.isPending && !customersQuery.data) {
    return <LoadingScreen label="Loading customer intelligence..." />;
  }

  if (customersQuery.isError) {
    return <div className="p-8 text-center text-rose-700">Unable to load customers. Please try again.</div>;
  }

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-600" /> : <ChevronDown className="w-3 h-3 text-brand-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-slate-500 mt-1">Manage your customer base and monitor retention signals.</p>
      </div>
      {customersQuery.isFetching && <p className="text-xs text-slate-400">Refreshing customer data...</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-100">
            <Users className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Total Customers</p>
            <p className="text-2xl font-bold text-slate-900">{totalCustomers}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-100">
            <TrendingDown className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">High Churn Risk</p>
            <p className="text-2xl font-bold text-slate-900">{highRisk}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Avg. Lifetime Value</p>
            <p className="text-2xl font-bold text-slate-900">₹{avgLtv.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1"
        />
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
          {['All', 'Enterprise', 'Premium', 'Standard'].map((s) => (
            <button
              key={s}
              onClick={() => setSegmentFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                segmentFilter === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <PaginationToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={sortedItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th onClick={() => handleSort('name')} className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-1">Customer {renderSortIcon('name')}</div>
                </th>
                <th onClick={() => handleSort('segment')} className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-1">Segment {renderSortIcon('segment')}</div>
                </th>
                <th onClick={() => handleSort('orders')} className="group cursor-pointer text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center justify-end gap-1">Orders {renderSortIcon('orders')}</div>
                </th>
                <th onClick={() => handleSort('ltv')} className="group cursor-pointer text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center justify-end gap-1">Lifetime Value {renderSortIcon('ltv')}</div>
                </th>
                <th onClick={() => handleSort('churnRisk')} className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-1">Churn Risk {renderSortIcon('churnRisk')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedItems.map((customer) => {
                const sc = SEGMENT_COLORS[customer.segment] || SEGMENT_COLORS.Standard;
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-indigo-100 flex items-center justify-center text-slate-600 text-sm font-bold flex-shrink-0 border border-slate-200 shadow-sm">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{customer.name}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail className="w-3 h-3" />{customer.email}
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
                    <td className="px-4 py-4 text-right text-slate-900 font-medium">{customer.orders}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-slate-900">₹{customer.ltv.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 w-44">
                      <ChurnBar value={customer.churnRisk} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No customers match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;
