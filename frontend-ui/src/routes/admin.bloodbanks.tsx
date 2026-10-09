import { createFileRoute } from '@tanstack/react-router';
import { BloodBanksDirectoryPage } from '@/features/aeroblood/pages/admin/BloodBanksDirectoryPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/bloodbanks')({
  head: () => portalHead('Blood Banks Directory', 'AERO-BLOOD admin portal: blood banks directory and clinical emergency network operations.'),
  component: BloodBanksDirectoryPage,
});
