import { createFileRoute } from '@tanstack/react-router';
import { BloodBankProfilePage } from '@/features/aeroblood/pages/bloodbank/BloodBankProfilePage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/profile')({
  head: () => portalHead('Blood Bank Profile', 'AERO-BLOOD bloodbank portal: blood bank profile and clinical emergency network operations.'),
  component: BloodBankProfilePage,
});
