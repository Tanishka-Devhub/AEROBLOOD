import React from 'react';
import { NavLink, useLocation } from '@/features/aeroblood/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  AlertOctagon,
  FileText,
  History,
  BrainCircuit,
  Building2,
  Package,
  Layers,
  Radar,
  ShieldBan,
  TrendingDown,
  ArrowRightLeft,
  Users,
  HeartHandshake,
  Truck,
  Droplet,
  Split,
  Network,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export const AeroSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  let portalName = 'HOSPITAL';
  let groups: SidebarGroup[] = [];

  if (currentPath.startsWith('/bloodbank')) {
    portalName = 'BLOOD BANK';
    groups = [
      {
        title: 'COMMAND CENTER',
        items: [
          { label: 'Dashboard', path: '/bloodbank', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Inventory', path: '/bloodbank/inventory', icon: <Package className="w-4 h-4" /> },
          { label: 'Blood Requests', path: '/bloodbank/requests', icon: <Layers className="w-4 h-4" /> },
        ],
      },
      {
        title: 'INTELLIGENCE',
        items: [
          { label: 'Expiry Radar', path: '/bloodbank/expiry', icon: <Radar className="w-4 h-4" /> },
          { label: 'Quarantine Action', path: '/bloodbank/quarantine', icon: <ShieldBan className="w-4 h-4" /> },
          { label: 'Shortage & Surplus', path: '/bloodbank/shortage-surplus', icon: <TrendingDown className="w-4 h-4" /> },
          { label: 'Redistribution', path: '/bloodbank/redistribution', icon: <ArrowRightLeft className="w-4 h-4" />, badge: 'Hero', badgeColor: 'bg-primary/20 text-clinical' },
          { label: 'Donor Intelligence', path: '/bloodbank/donor-intelligence', icon: <BrainCircuit className="w-4 h-4" />, badge: 'Hero', badgeColor: 'bg-primary/20 text-clinical' },
          { label: 'Allocation Preview', path: '/bloodbank/allocation-preview', icon: <FileText className="w-4 h-4" /> },
        ],
      },
      {
        title: 'OPERATIONS',
        items: [
          { label: 'Donors Registry', path: '/bloodbank/donors', icon: <Users className="w-4 h-4" /> },
          { label: 'Donations History', path: '/bloodbank/donations', icon: <HeartHandshake className="w-4 h-4" /> },
          { label: 'Blood Transfers', path: '/bloodbank/transfers', icon: <Truck className="w-4 h-4" /> },
        ],
      },
      {
        title: 'SYSTEM',
        items: [
          { label: 'Blood Groups', path: '/bloodbank/blood-groups', icon: <Droplet className="w-4 h-4" /> },
          { label: 'Blood Compatibility', path: '/bloodbank/compatibility', icon: <Split className="w-4 h-4" /> },
          { label: 'Blood Bank Profile', path: '/bloodbank/profile', icon: <Building2 className="w-4 h-4" /> },
        ],
      },
    ];
  } else if (currentPath.startsWith('/admin')) {
    portalName = 'NETWORK ADMIN';
    groups = [
      {
        title: 'NETWORK COMMAND',
        items: [
          { label: 'Network Overview', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Network Inventory', path: '/admin/inventory', icon: <Package className="w-4 h-4" /> },
          { label: 'Hospitals Directory', path: '/admin/hospitals', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Blood Banks Directory', path: '/admin/bloodbanks', icon: <Network className="w-4 h-4" /> },
        ],
      },
      {
        title: 'INTELLIGENCE',
        items: [
          { label: 'Emergency Overview', path: '/admin/emergency', icon: <AlertOctagon className="w-4 h-4" /> },
          { label: 'Shortage Network', path: '/admin/shortage-network', icon: <TrendingDown className="w-4 h-4" /> },
          { label: 'Redistribution Network', path: '/admin/redistribution-network', icon: <ArrowRightLeft className="w-4 h-4" /> },
          { label: 'Donor Intelligence', path: '/admin/donor-intelligence', icon: <BrainCircuit className="w-4 h-4" /> },
        ],
      },
      {
        title: 'SYSTEM OVERSIGHT',
        items: [
          { label: 'All Requests', path: '/admin/requests', icon: <Layers className="w-4 h-4" /> },
          { label: 'All Allocations', path: '/admin/allocations', icon: <FileText className="w-4 h-4" /> },
          { label: 'All Transfers', path: '/admin/transfers', icon: <Truck className="w-4 h-4" /> },
          { label: 'System Health & DB', path: '/admin/health', icon: <Activity className="w-4 h-4" /> },
        ],
      },
    ];
  } else {
    // Default to Hospital
    portalName = 'HOSPITAL';
    groups = [
      {
        title: 'OVERVIEW',
        items: [
          { label: 'Dashboard', path: '/hospital', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'New Request', path: '/hospital/new-request', icon: <PlusCircle className="w-4 h-4" /> },
          { label: 'Emergency Request', path: '/hospital/emergency', icon: <AlertOctagon className="w-4 h-4" />, badge: 'Urgent', badgeColor: 'bg-primary/20 text-blood-light' },
          { label: 'My Requests', path: '/hospital/requests', icon: <FileText className="w-4 h-4" /> },
          { label: 'Request History', path: '/hospital/history', icon: <History className="w-4 h-4" /> },
        ],
      },
      {
        title: 'INTELLIGENCE',
        items: [
          { label: 'Allocation Intelligence', path: '/hospital/allocation-intelligence', icon: <BrainCircuit className="w-4 h-4" />, badge: 'AI', badgeColor: 'bg-primary/20 text-clinical' },
        ],
      },
      {
        title: 'ACCOUNT',
        items: [
          { label: 'Hospital Profile', path: '/hospital/profile', icon: <Building2 className="w-4 h-4" /> },
        ],
      },
    ];
  }

  return (
    <aside className="portal-sidebar w-64 bg-background text-muted-foreground flex flex-col shrink-0 border-r border-border select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-border/80 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary flex items-center justify-center text-foreground font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            A
          </div>
          <div>
            <div className="text-foreground font-extrabold tracking-normal text-base leading-none">
              AERO<span className="text-blood-light">-BLOOD</span>
            </div>
            <div className="text-[9px] uppercase tracking-normalr text-muted-foreground mt-1 font-semibold">
              {portalName} PORTAL
            </div>
          </div>
        </NavLink>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-normalr text-muted-foreground px-3 mb-2">
              {group.title}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item, iIdx) => (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  end={item.path === '/hospital' || item.path === '/bloodbank' || item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-primary text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] uppercase font-bold tracking-normalr px-1.5 py-0.5 rounded ${
                        item.badgeColor || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Telemetry Footer */}
      <div className="p-4 border-t border-border/80 bg-background/40 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="font-medium text-muted-foreground">Philosophy:</span>
          <span className="font-mono text-clinical font-bold text-[10px]">DETECT · DECIDE · RESPOND</span>
        </div>
        <NavLink
          to="/"
          className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground p-2 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <span>Switch Demo Role</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>
    </aside>
  );
};
