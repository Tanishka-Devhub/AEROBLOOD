import { createFileRoute } from '@tanstack/react-router';
import { AdminShortageNetworkPage } from '@/features/aeroblood/pages/admin/AdminShortageNetworkPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/shortage-network')({
  head: () => portalHead('Admin Shortage Network', 'AERO-BLOOD admin portal: admin shortage network and clinical emergency network operations.'),
  component: AdminShortageNetworkPage,
});
