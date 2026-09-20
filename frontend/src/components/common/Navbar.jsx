import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import SearchField from './SearchField';
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
  { id: 'p1', title: 'Dashboard Overview', subtitle: 'Key metrics, executive KPIs, and live revenue pulse', category: 'Pages', path: '/', icon: LayoutDashboard },
  { id: 'p2', title: 'Inventory Management', subtitle: 'Real-time stock, reorder levels, and SKU tracking', category: 'Pages', path: '/inventory', icon: Package },
  { id: 'p3', title: 'Customer Intelligence', subtitle: 'Customer directory, LTV, and churn risk predictions', category: 'Pages', path: '/customers', icon: Users },
  { id: 'p4', title: 'Revenue Analytics', subtitle: 'Sales channels, historical trends, and order volumes', category: 'Pages', path: '/analytics', icon: BarChart3 },
  { id: 'p5', title: 'AI Assistant', subtitle: 'BizPilot AI autonomous business co-pilot and PO drafter', category: 'Pages', path: '/ai-assistant', icon: Sparkles },
  { id: 'p6', title: 'System Settings', subtitle: 'Profile, security, notifications, and database health', category: 'Pages', path: '/settings', icon: SettingsIcon },
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
  const [notifications, setNotifications] = useState([]);
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
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 sticky top-0">
      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-white px-5 py-3 rounded-xl text-sm text-slate-800 border border-slate-200 shadow-xl animate-fade-in flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Global Search Bar (Trigger) */}
      <div className="flex-1 max-w-xl relative hidden md:block" ref={searchContainerRef}>
        <div
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between pl-11 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 cursor-pointer transition-all shadow-sm group"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
          </div>
          <span className="text-sm">Search inventory, customers, actions...</span>
          <kbd className="inline-flex items-center gap-1 border border-slate-200 bg-white px-2 py-0.5 rounded text-xs font-mono text-slate-500 shadow-sm">
            ⌘K
          </kbd>
        </div>

        {/* Global Search Modal / Dropdown */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-scale-up">
              {/* Search Header Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50">
                <SearchField
                  inputRef={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Type to search inventory, customers, or actions..."
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 font-mono px-1.5 py-0.5 border border-slate-200 rounded bg-white">
                  ESC
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-white overflow-x-auto text-xs">
                {['All', 'Pages', 'Inventory', 'Customers', 'Actions'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setSelectedIndex(0);
                    }}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Results List */}
              <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
                {filteredResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching for SKU, customer name, or action.</p>
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
                            ? 'bg-brand-50 border border-brand-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? 'bg-brand-100 text-brand-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${isSelected ? 'text-brand-800' : 'text-slate-800'}`}>{item.title}</span>
                              {item.badge && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span className="text-[11px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                            {item.category}
                          </span>
                          <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Hint */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1 py-0.5 border border-slate-300 rounded bg-white">↑↓</kbd> to navigate</span>
                  <span><kbd className="px-1 py-0.5 border border-slate-300 rounded bg-white">↵</kbd> to select</span>
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
                ? 'bg-brand-50 text-brand-600 border border-brand-200'
                : 'text-slate-500 hover:text-brand-600 hover:bg-slate-50'
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

          {/* Interactive Notifications Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-scale-up">
              {/* Notifications Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-brand-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-medium bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full border border-brand-200">
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
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="text-sm font-medium text-slate-700">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1">No pending notifications at this time.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationSelect(n)}
                      className={`p-4 transition-all cursor-pointer hover:bg-slate-50 flex items-start gap-3.5 relative group ${
                        n.unread ? 'bg-brand-50/50' : 'opacity-80'
                      }`}
                    >
                      {/* Indicator dot */}
                      {n.unread && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 absolute top-4 left-2" />
                      )}

                      {/* Icon */}
                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 mt-0.5">
                        {getNotifIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold truncate ${n.unread ? 'text-slate-900' : 'text-slate-600'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {n.description}
                        </p>
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100">
                          <span className="text-[11px] font-medium text-brand-600 group-hover:text-brand-500 flex items-center gap-1">
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
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs">
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

        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-800">{user?.name || 'Account'}</span>
            <span className="text-xs text-brand-600">{user?.business?.name || 'Business'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-indigo-100 flex items-center justify-center p-0.5 shadow-sm border border-slate-200">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
              <UserIcon className="w-5 h-5 text-slate-600" />
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
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
