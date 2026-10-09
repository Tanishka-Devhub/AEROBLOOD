import { createFileRoute } from '@tanstack/react-router';
import { DonationsPage } from '@/features/aeroblood/pages/bloodbank/DonationsPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/donations')({
  head: () => portalHead('Donations', 'AERO-BLOOD bloodbank portal: donations and clinical emergency network operations.'),
  component: DonationsPage,
});
