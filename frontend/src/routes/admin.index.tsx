import { createFileRoute } from '@tanstack/react-router';
import { AdminOverview } from '@/features/aeroblood/pages/admin/AdminOverview';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/')({
  head: () => portalHead('Admin Overview', 'AERO-BLOOD admin portal: admin overview and clinical emergency network operations.'),
  component: AdminOverview,
});
