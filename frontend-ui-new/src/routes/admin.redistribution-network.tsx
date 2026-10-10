import { createFileRoute } from '@tanstack/react-router';
import { AdminRedistributionNetworkPage } from '@/features/aeroblood/pages/admin/AdminRedistributionNetworkPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/redistribution-network')({
  head: () => portalHead('Admin Redistribution Network', 'AERO-BLOOD admin portal: admin redistribution network and clinical emergency network operations.'),
  component: AdminRedistributionNetworkPage,
});
