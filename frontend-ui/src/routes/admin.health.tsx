import { createFileRoute } from '@tanstack/react-router';
import { SystemHealthPage } from '@/features/aeroblood/pages/admin/SystemHealthPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/health')({
  head: () => portalHead('System Health', 'AERO-BLOOD admin portal: system health and clinical emergency network operations.'),
  component: SystemHealthPage,
});
