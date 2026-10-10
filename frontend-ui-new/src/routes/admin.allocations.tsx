import { createFileRoute } from '@tanstack/react-router';
import { AdminAllocationsPage } from '@/features/aeroblood/pages/admin/AdminAllocationsPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/allocations')({
  head: () => portalHead('Admin Allocations', 'AERO-BLOOD admin portal: admin allocations and clinical emergency network operations.'),
  component: AdminAllocationsPage,
});
