import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart2, 
  BrainCircuit, 
  Boxes, 
  Users, 
  Settings,
  Sparkles
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'AI Assistant', path: '/ai-assistant', icon: BrainCircuit },
    { name: 'Inventory', path: '/inventory', icon: Boxes },
    { name: 'Customers', path: '/customers', icon: Users },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-y-0 border-l-0 flex flex-col z-20">
      <div className="h-20 flex items-center px-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">BizPilot <span className="text-brand-400 font-light">AI</span></span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-300 group"
        >
          <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
          <span className="font-medium">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
