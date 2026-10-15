import React, { useEffect, useState } from 'react';
import { AeroSidebar } from './AeroSidebar';
import { AeroHeader } from './AeroHeader';
import { EmergencyBanner } from './EmergencyBanner';
import { bloodRequestsApi } from '../../api';

interface AeroShellProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  activePortal?: 'HOSPITAL' | 'BLOODBANK' | 'ADMIN';
}

export const AeroShell: React.FC<AeroShellProps> = ({
  title,
  subtitle,
  children,
  actions,
}) => {
  const [emergencyCount, setEmergencyCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchEmergencyStats = async () => {
      try {
        const requests = await bloodRequestsApi.getAll({ priority: 'EMERGENCY', status: 'PENDING' });
        if (isMounted && Array.isArray(requests)) {
          setEmergencyCount(requests.length);
        }
      } catch {
        // Silently tolerate if request fails on initial telemetry load
      }
    };

    fetchEmergencyStats();
    const interval = setInterval(fetchEmergencyStats, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Permanent Portal Sidebar */}
      <AeroSidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AeroHeader title={title} subtitle={subtitle} actions={actions} />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {emergencyCount > 0 && (
            <EmergencyBanner count={emergencyCount} />
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
