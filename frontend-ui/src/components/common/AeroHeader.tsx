import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { APIStatusIndicator } from './APIStatusIndicator';
import { Shield, Building, Network } from 'lucide-react';

interface AeroHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AeroHeader: React.FC<AeroHeaderProps> = ({ title, subtitle, actions }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Page Title & Breadcrumb context */}
      <div>
        {title && (
          <h1 className="text-xl font-bold tracking-tight text-slate-100 leading-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right controls: Role Selector Switcher + Live API Status + Custom Actions */}
      <div className="flex items-center gap-3">
        {/* Role Quick-Switcher Pills */}
        <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <NavLink
            to="/hospital"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentPath.startsWith('/hospital')
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Hospital</span>
          </NavLink>

          <NavLink
            to="/bloodbank"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentPath.startsWith('/bloodbank')
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>Blood Bank</span>
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentPath.startsWith('/admin')
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Network className="w-3.5 h-3.5 text-teal-600" />
            <span>Admin</span>
          </NavLink>
        </div>

        {/* Live Backend Telemetry Indicator */}
        <APIStatusIndicator />

        {/* Page Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
