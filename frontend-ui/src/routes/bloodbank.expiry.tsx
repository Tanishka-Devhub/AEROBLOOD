import { createFileRoute } from '@tanstack/react-router';
import { ExpiryRadarPage } from '@/features/aeroblood/pages/bloodbank/ExpiryRadarPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/expiry')({
  head: () => portalHead('Expiry Radar', 'AERO-BLOOD bloodbank portal: expiry radar and clinical emergency network operations.'),
  component: ExpiryRadarPage,
});
