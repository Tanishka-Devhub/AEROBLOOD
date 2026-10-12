import { createFileRoute } from '@tanstack/react-router';
import { BloodTransfersPage } from '@/features/aeroblood/pages/bloodbank/BloodTransfersPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/transfers')({
  head: () => portalHead('Blood Transfers', 'AERO-BLOOD bloodbank portal: blood transfers and clinical emergency network operations.'),
  component: BloodTransfersPage,
});
