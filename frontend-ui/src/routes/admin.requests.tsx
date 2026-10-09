import { createFileRoute } from '@tanstack/react-router';
import { AdminRequestsPage } from '@/features/aeroblood/pages/admin/AdminRequestsPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/requests')({
  head: () => portalHead('Admin Requests', 'AERO-BLOOD admin portal: admin requests and clinical emergency network operations.'),
  component: AdminRequestsPage,
});
