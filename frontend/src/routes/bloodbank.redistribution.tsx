import { createFileRoute } from '@tanstack/react-router';
import { RedistributionPage } from '@/features/aeroblood/pages/bloodbank/RedistributionPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/redistribution')({
  head: () => portalHead('Redistribution', 'AERO-BLOOD bloodbank portal: redistribution and clinical emergency network operations.'),
  component: RedistributionPage,
});
