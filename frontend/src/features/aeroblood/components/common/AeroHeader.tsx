import React from 'react';
import { NavLink, useLocation } from '@/features/aeroblood/navigation';
import { APIStatusIndicator } from './APIStatusIndicator';
import { Shield, Building, Network } from 'lucide-react';

interface AeroHeaderProps {
  title?: string | undefined;
  subtitle?: string | undefined;
  actions?: React.ReactNode;
}

export const AeroHeader: React.FC<AeroHeaderProps> = ({ title, subtitle, actions }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="portal-header bg-secondary border-b border-border px-6 py-4 sticky top-0 z-30 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Page Title & Breadcrumb context */}
      <div>
        {title && (
          <h1 className="text-xl font-medium tracking-normal text-foreground leading-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right controls: Role Selector Switcher + Live API Status + Custom Actions */}
      <div className="flex items-center gap-3">
        {/* Role Quick-Switcher Pills */}
        <div className="hidden md:flex items-center p-1 bg-muted rounded-lg border border-border/80 text-xs font-semibold">
          <NavLink
            to="/hospital"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentPath.startsWith('/hospital')
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Building className="w-3.5 h-3.5 text-foreground" />
            <span>Hospital</span>
          </NavLink>

          <NavLink
            to="/bloodbank"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentPath.startsWith('/bloodbank')
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Shield className="w-3.5 h-3.5 text-blood-light" />
            <span>Blood Bank</span>
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentPath.startsWith('/admin')
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Network className="w-3.5 h-3.5 text-clinical" />
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
