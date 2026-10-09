import { createFileRoute } from '@tanstack/react-router';
import { AdminDonorIntelligencePage } from '@/features/aeroblood/pages/admin/AdminDonorIntelligencePage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/donor-intelligence')({
  head: () => portalHead('Admin Donor Intelligence', 'AERO-BLOOD admin portal: admin donor intelligence and clinical emergency network operations.'),
  component: AdminDonorIntelligencePage,
});
