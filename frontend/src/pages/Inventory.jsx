import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, XCircle, CheckCircle, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import PaginationToolbar from '../components/common/PaginationToolbar';
import SearchField from '../components/common/SearchField';
import LoadingScreen from '../components/common/LoadingScreen';

const STATUS_CONFIG = {
  'In Stock': { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: CheckCircle },
  'Low Stock': { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', icon: AlertTriangle },
  'Out of Stock': { color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', icon: XCircle },
};

const Inventory = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [restockingId, setRestockingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Table State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.getInventory,
    staleTime: 2 * 60 * 1000,
  });
  const inventory = inventoryQuery.data?.data || [];
  const filtered = inventory.filter((item) => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const query = search.trim().toLowerCase();
    return matchesStatus && (!query || item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query) || item.category.toLowerCase().includes(query));
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleRestock = async (id, name) => {
    setRestockingId(id);
    try {
      const res = await inventoryService.restockItem(id);
      if (res.success) showToast(`✅ Restock order created for "${name}"`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to create restock order.');
    } finally {
      setRestockingId(null);
    }
  };

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

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter((i) => i.status === 'Out of Stock').length;

  if (inventoryQuery.isPending && !inventoryQuery.data) {
    return <LoadingScreen label="Syncing your inventory..." />;
  }

  if (inventoryQuery.isError) {
    return <div className="p-8 text-center text-rose-700">Unable to load inventory. Please try again.</div>;
  }

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-600" /> : <ChevronDown className="w-3 h-3 text-brand-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-50 px-5 py-3 rounded-xl text-sm text-emerald-800 border border-emerald-200 shadow-xl animate-bounce font-medium">
            {toastMsg}
          </div>
      )}

          {/* Header */}
          <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-slate-500 mt-1">Monitor stock levels and manage product inventory.</p>
      </div >
  { inventoryQuery.isFetching && <p className="text-xs text-slate-400">Refreshing inventory data...</p> }

{/* Summary Cards */ }
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-100">
            <Package className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Total SKUs</p>
            <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
          </div>
        </div >
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Low Stock</p>
            <p className="text-2xl font-bold text-slate-900">{lowStockCount}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-100">
            <XCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Out of Stock</p>
            <p className="text-2xl font-bold text-slate-900">{outOfStockCount}</p>
      </div>
    </div>
  </div>

{/* Controls */ }
<div className="flex flex-col md:flex-row gap-3">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU, or category..."
          className="flex-1"
        />
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
      {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((s) => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === s
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          {s}
        </button>
      ))}
    </div>
  </div>

{/* Table */ }
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
                  <div className="flex items-center gap-1">Product {renderSortIcon('name')}</div>
                </th>
                <th onClick={() => handleSort('sku')} className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-1">SKU {renderSortIcon('sku')}</div>
                </th>
                <th onClick={() => handleSort('category')} className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-1">Category {renderSortIcon('category')}</div>
                </th>
                <th onClick={() => handleSort('currentStock')} className="group cursor-pointer text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center justify-end gap-1">Stock {renderSortIcon('currentStock')}</div>
                </th>
                <th onClick={() => handleSort('reorderLevel')} className="group cursor-pointer text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center justify-end gap-1">Reorder Level {renderSortIcon('reorderLevel')}</div>
                </th>
                <th onClick={() => handleSort('status')} className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-1">Status {renderSortIcon('status')}</div>
                </th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedItems.map((item) => {
                const sc = STATUS_CONFIG[item.status];
                const StatusIcon = sc.icon;
                const needsRestock = item.status !== 'In Stock';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">₹{item.price.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-4 text-slate-600">{item.category}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-bold text-lg ${
                        item.currentStock === 0 ? 'text-rose-600' :
                        item.currentStock <= item.reorderLevel ? 'text-amber-600' : 'text-slate-700'
                      }`}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-slate-500">{item.reorderLevel}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${sc.color} ${sc.bg} ${sc.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {needsRestock && (
                        <button
                          onClick={() => handleRestock(item.id, item.name)}
                          disabled={restockingId === item.id}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${restockingId === item.id ? 'animate-spin' : ''}`} />
                          {restockingId === item.id ? 'Creating...' : 'Restock'}
                        </button>
                      )}
                    </td>
                  </tr >
                );
              })}
            </tbody >
          </table >
{
  filtered.length === 0 && (
    <div className="py-12 text-center text-slate-400">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No items match your search or filter.</p>
      </div>
          )}
    </div>
      </div>
    </div >
  );
};

export default Inventory;
