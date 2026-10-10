import { createFileRoute } from '@tanstack/react-router';
import { AdminTransfersPage } from '@/features/aeroblood/pages/admin/AdminTransfersPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/transfers')({
  head: () => portalHead('Admin Transfers', 'AERO-BLOOD admin portal: admin transfers and clinical emergency network operations.'),
  component: AdminTransfersPage,
});
