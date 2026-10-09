import { createFileRoute } from '@tanstack/react-router';
import { AdminEmergencyOverviewPage } from '@/features/aeroblood/pages/admin/AdminEmergencyOverviewPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/emergency')({
  head: () => portalHead('Admin Emergency Overview', 'AERO-BLOOD admin portal: admin emergency overview and clinical emergency network operations.'),
  component: AdminEmergencyOverviewPage,
});
