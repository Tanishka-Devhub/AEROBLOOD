import { createFileRoute } from '@tanstack/react-router';
import { ShortageSurplusPage } from '@/features/aeroblood/pages/bloodbank/ShortageSurplusPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/shortage-surplus')({
  head: () => portalHead('Shortage Surplus', 'AERO-BLOOD bloodbank portal: shortage surplus and clinical emergency network operations.'),
  component: ShortageSurplusPage,
});
