import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, XCircle, CheckCircle, RefreshCw, Filter } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

const STATUS_CONFIG = {
  'In Stock':     { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle },
  'Low Stock':    { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   icon: AlertTriangle },
  'Out of Stock': { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    icon: XCircle },
};

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [restockingId, setRestockingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    inventoryService.getInventory().then((res) => {
      if (res.success) {
        setInventory(res.data);
        setFiltered(res.data);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = inventory;
    if (statusFilter !== 'All') result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statusFilter, inventory]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleRestock = async (id, name) => {
    setRestockingId(id);
    const res = await inventoryService.restockItem(id);
    setRestockingId(null);
    if (res.success) showToast(`✅ Restock order created for "${name}"`);
  };

  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter((i) => i.status === 'Out of Stock').length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 glass-panel px-5 py-3 rounded-xl text-sm text-white border border-emerald-500/30 bg-emerald-500/10 shadow-xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Inventory</h1>
        <p className="text-slate-400 mt-1">Monitor stock levels and manage product inventory.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-400/10">
            <Package className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total SKUs</p>
            <p className="text-2xl font-bold text-white">{totalItems}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-400/10">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Low Stock</p>
            <p className="text-2xl font-bold text-white">{lowStockCount}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-400/10">
            <XCircle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Out of Stock</p>
            <p className="text-2xl font-bold text-white">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="input-field pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
          {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === s
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Product</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">SKU</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Category</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Stock</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Reorder Level</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-4">Status</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map((item) => {
                const sc = STATUS_CONFIG[item.status];
                const StatusIcon = sc.icon;
                const needsRestock = item.status !== 'In Stock';
                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">₹{item.price.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-4 text-slate-400">{item.category}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-bold text-lg ${
                        item.currentStock === 0 ? 'text-rose-400' :
                        item.currentStock <= item.reorderLevel ? 'text-amber-400' : 'text-white'
                      }`}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-slate-400">{item.reorderLevel}</td>
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
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 transition-all disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${restockingId === item.id ? 'animate-spin' : ''}`} />
                          {restockingId === item.id ? 'Creating...' : 'Restock'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No items match your search or filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
