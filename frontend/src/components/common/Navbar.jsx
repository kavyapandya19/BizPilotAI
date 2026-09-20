import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  X,
  CheckCheck,
  Trash2,
  Sparkles,
  Package,
  Users,
  BarChart3,
  LayoutDashboard,
  Settings as SettingsIcon,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Layers,
} from 'lucide-react';

const SEARCH_DATABASE = [
  // Pages
  { id: 'p1', title: 'Dashboard Overview', subtitle: 'Key metrics, executive KPIs, and live revenue pulse', category: 'Pages', path: '/', icon: LayoutDashboard },
  { id: 'p2', title: 'Inventory Management', subtitle: 'Real-time stock, reorder levels, and SKU tracking', category: 'Pages', path: '/inventory', icon: Package },
  { id: 'p3', title: 'Customer Intelligence', subtitle: 'Customer directory, LTV, and churn risk predictions', category: 'Pages', path: '/customers', icon: Users },
  { id: 'p4', title: 'Revenue Analytics', subtitle: 'Sales channels, historical trends, and order volumes', category: 'Pages', path: '/analytics', icon: BarChart3 },
  { id: 'p5', title: 'AI Assistant', subtitle: 'BizPilot AI autonomous business co-pilot and PO drafter', category: 'Pages', path: '/ai-assistant', icon: Sparkles },
  { id: 'p6', title: 'System Settings', subtitle: 'Profile, security, notifications, and database health', category: 'Pages', path: '/settings', icon: SettingsIcon },

  // Inventory items
  { id: 'i1', title: 'Smart Watch S3 (SKU-192)', subtitle: 'Electronics • Critically Low Stock (8 units) • ₹199.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'Low Stock', badgeColor: 'text-amber-400 bg-amber-400/10' },
  { id: 'i2', title: '4K Webcam Pro (SKU-254)', subtitle: 'Electronics • Out of Stock (0 units) • ₹129.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'Out of Stock', badgeColor: 'text-rose-400 bg-rose-400/10' },
  { id: 'i3', title: 'Laptop Stand Pro (SKU-203)', subtitle: 'Accessories • Out of Stock (0 units) • ₹49.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'Out of Stock', badgeColor: 'text-rose-400 bg-rose-400/10' },
  { id: 'i4', title: 'Portable SSD 1TB (SKU-332)', subtitle: 'Storage • Out of Stock (0 units) • ₹109.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'Out of Stock', badgeColor: 'text-rose-400 bg-rose-400/10' },
  { id: 'i5', title: 'USB-C Hub 7-in-1 (SKU-228)', subtitle: 'Accessories • Low Stock (5 units left) • ₹19.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'Low Stock', badgeColor: 'text-amber-400 bg-amber-400/10' },
  { id: 'i6', title: 'Pro Headphones X1 (SKU-101)', subtitle: 'Electronics • In Stock (142 units) • ₹99.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'In Stock', badgeColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'i7', title: 'Mechanical Keyboard (SKU-215)', subtitle: 'Peripherals • In Stock (67 units) • ₹99.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'In Stock', badgeColor: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'i8', title: 'Noise-Cancel Earbuds (SKU-306)', subtitle: 'Electronics • Low Stock (7 units) • ₹149.99', category: 'Inventory', path: '/inventory', icon: Package, badge: 'Low Stock', badgeColor: 'text-amber-400 bg-amber-400/10' },

  // Customers
  { id: 'c1', title: 'Priya Sharma', subtitle: 'Standard • LTV: ₹1,800 • High Churn Risk: 81%', category: 'Customers', path: '/customers', icon: Users, badge: '81% Churn', badgeColor: 'text-rose-400 bg-rose-400/10' },
  { id: 'c2', title: 'David Kim', subtitle: 'Enterprise • Top Account • LTV: ₹31,500 (Inactive 6 wks)', category: 'Customers', path: '/customers', icon: Users, badge: 'VIP Inactive', badgeColor: 'text-amber-400 bg-amber-400/10' },
  { id: 'c3', title: 'Sarah Johnson', subtitle: 'Enterprise • Active • LTV: ₹18,400 • 42 Orders', category: 'Customers', path: '/customers', icon: Users, badge: 'Enterprise', badgeColor: 'text-brand-400 bg-brand-400/10' },
  { id: 'c4', title: 'Michael Chen', subtitle: 'Enterprise • Active • LTV: ₹14,200 • 38 Orders', category: 'Customers', path: '/customers', icon: Users, badge: 'Enterprise', badgeColor: 'text-brand-400 bg-brand-400/10' },
  { id: 'c5', title: 'Tom Bauer', subtitle: 'Standard • LTV: ₹2,100 • Churn Risk: 74%', category: 'Customers', path: '/customers', icon: Users, badge: '74% Churn', badgeColor: 'text-rose-400 bg-rose-400/10' },
  { id: 'c6', title: 'Aisha Patel', subtitle: 'Standard • LTV: ₹3,200 • Churn Risk: 67%', category: 'Customers', path: '/customers', icon: Users, badge: '67% Churn', badgeColor: 'text-amber-400 bg-amber-400/10' },

  // Quick Actions
  { id: 'a1', title: 'Draft Purchase Order for Low Stock', subtitle: 'Autonomous AI PO creation for SKU-192 & stockout items', category: 'Actions', path: '/ai-assistant', icon: Sparkles },
  { id: 'a2', title: 'Review Churn Risk Win-Back Strategy', subtitle: 'Inspect elevated churn risk accounts and retention campaigns', category: 'Actions', path: '/customers', icon: AlertTriangle },
  { id: 'a3', title: 'Inspect Weekly Revenue Breakdown', subtitle: 'Analyze Thursday spike (₹6,100) and Enterprise revenue contribution', category: 'Actions', path: '/analytics', icon: TrendingUp },
  { id: 'a4', title: 'Check Database & Service Status', subtitle: 'Inspect MongoDB connection and API infrastructure health', category: 'Actions', path: '/settings', icon: SettingsIcon },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Critical Inventory Alert',
    description: 'Smart Watch S3 (SKU-192) has only 8 units left (reorder threshold: 15).',
    time: '10m ago',
    type: 'critical',
    unread: true,
    path: '/inventory',
    actionText: 'Restock SKU-192',
  },
  {
    id: 2,
    title: 'High Churn Risk Customer',
    description: 'Priya Sharma (churn score: 81%) has not placed an order in 45 days.',
    time: '35m ago',
    type: 'warning',
    unread: true,
    path: '/customers',
    actionText: 'View Customer',
  },
  {
    id: 3,
    title: 'Autonomous PO Draft Ready',
    description: 'BizPilot AI generated draft #PO-2026-089 for 3 zero-stock items.',
    time: '1h ago',
    type: 'ai',
    unread: true,
    path: '/ai-assistant',
    actionText: 'Review PO',
  },
  {
    id: 4,
    title: 'Weekly Revenue Milestone',
    description: 'Weekly revenue crossed ₹32,900, marking +12.5% WoW expansion.',
    time: '3h ago',
    type: 'success',
    unread: false,
    path: '/analytics',
    actionText: 'View Analytics',
  },
  {
    id: 5,
    title: 'Supply Chain Depletion Alert',
    description: 'USB-C Hub 7-in-1 is projected to stock out completely in 3 days.',
    time: '5h ago',
    type: 'warning',
    unread: false,
    path: '/inventory',
    actionText: 'Check Inventory',
  },
];

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Notification State
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState('');

  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        setIsNotifOpen(false);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Search Results
  const filteredResults = SEARCH_DATABASE.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Handle item selection in search
  const handleSelectResult = (item) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(item.path);
    showToast(`Navigated to ${item.title}`);
  };

  // Handle arrow key navigation in search results
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % (filteredResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    }
  };

  // Notification Helpers
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = () => {
    setIsNotifOpen((prev) => !prev);
    setIsSearchOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('All notifications cleared');
  };

  const handleNotificationSelect = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    setIsNotifOpen(false);
    navigate(notif.path);
    showToast(`Opening ${notif.title}`);
  };

  const dismissNotification = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-brand-400" />;
      case 'success':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <header className="h-20 glass-panel border-b border-x-0 border-t-0 flex items-center justify-between px-6 z-20 sticky top-0">
      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 glass-panel px-5 py-3 rounded-xl text-sm text-white border border-brand-500/30 bg-slate-900/95 shadow-2xl animate-fade-in flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Global Search Bar (Trigger) */}
      <div className="flex-1 max-w-xl relative hidden md:block" ref={searchContainerRef}>
        <div
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between pl-11 pr-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-400 cursor-pointer transition-all shadow-md group"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-hover:text-brand-400 transition-colors" />
          </div>
          <span className="text-sm">Search inventory, customers, actions...</span>
          <kbd className="inline-flex items-center gap-1 border border-slate-700 bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-400 shadow-sm">
            ⌘K
          </kbd>
        </div>

        {/* Global Search Modal / Dropdown - 100% Solid, Opaque Window */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 animate-fade-in">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-scale-up">
              {/* Search Header Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700 bg-slate-800">
                <Search className="w-5 h-5 text-brand-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Type to search inventory, customers, or actions..."
                  className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs text-slate-400 font-mono px-1.5 py-0.5 border border-slate-700 rounded bg-slate-800">
                  ESC
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900 overflow-x-auto text-xs">
                {['All', 'Pages', 'Inventory', 'Customers', 'Actions'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setSelectedIndex(0);
                    }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results List */}
              <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-800 bg-slate-900">
                {filteredResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="text-sm">No results found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-600 mt-1">Try searching for SKU, customer name, or action.</p>
                  </div>
                ) : (
                  filteredResults.map((item, idx) => {
                    const ItemIcon = item.icon || Layers;
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-800 border border-brand-500/40 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? 'bg-brand-500/20 text-brand-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white">{item.title}</span>
                              {item.badge && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-700 text-slate-300'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span className="text-[11px] text-slate-500 border border-slate-700/60 rounded px-1.5 py-0.5">
                            {item.category}
                          </span>
                          <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-600'}`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Hint */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1 py-0.5 border border-slate-700 rounded bg-slate-800">↑↓</kbd> to navigate</span>
                  <span><kbd className="px-1 py-0.5 border border-slate-700 rounded bg-slate-800">↵</kbd> to select</span>
                </div>
                <span>BizPilot AI Quick Search</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-5 ml-auto">
        {/* Mobile Search Icon */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="md:hidden p-2 text-slate-400 hover:text-brand-400 transition-colors"
          title="Search"
        >
          <Search className="w-6 h-6" />
        </button>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notifContainerRef}>
          <button
            onClick={handleNotificationClick}
            className={`relative p-2.5 rounded-xl transition-all ${
              isNotifOpen
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-brand-400 hover:bg-slate-800/50'
            }`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Panel - Solid Opaque */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden z-50 animate-scale-up">
              {/* Notifications Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-800">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-medium bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 bg-slate-900">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                    <p className="text-sm font-medium text-slate-300">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1">No pending notifications at this time.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationSelect(n)}
                      className={`p-4 transition-all cursor-pointer hover:bg-slate-800/40 flex items-start gap-3.5 relative group ${
                        n.unread ? 'bg-brand-500/[0.04]' : 'opacity-80'
                      }`}
                    >
                      {/* Indicator dot */}
                      {n.unread && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 absolute top-4 left-2" />
                      )}

                      {/* Icon */}
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/50 flex-shrink-0 mt-0.5">
                        {getNotifIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold truncate ${n.unread ? 'text-white' : 'text-slate-300'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-500 flex-shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {n.description}
                        </p>
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-800/40">
                          <span className="text-[11px] font-medium text-brand-400 group-hover:text-brand-300 flex items-center gap-1">
                            {n.actionText} <ArrowRight className="w-3 h-3" />
                          </span>
                          <button
                            onClick={(e) => dismissNotification(e, n.id)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Notifications Footer */}
              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-xs">
                  <span className="text-slate-500 text-[11px]">{notifications.length} alerts logged</span>
                  <button
                    onClick={clearAllNotifications}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-700/60 hidden sm:block"></div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-200">{user?.name || 'Admin User'}</span>
            <span className="text-xs text-brand-400">{user?.business?.name || 'Acme Corp'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
              <UserIcon className="w-5 h-5 text-slate-300" />
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
