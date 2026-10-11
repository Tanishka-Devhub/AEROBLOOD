import { createFileRoute } from '@tanstack/react-router';
import { DonorsPage } from '@/features/aeroblood/pages/bloodbank/DonorsPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/donors')({
  head: () => portalHead('Donors', 'AERO-BLOOD bloodbank portal: donors and clinical emergency network operations.'),
  component: DonorsPage,
});
