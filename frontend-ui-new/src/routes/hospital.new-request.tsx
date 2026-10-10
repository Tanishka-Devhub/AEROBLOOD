import { createFileRoute } from '@tanstack/react-router';
import { NewRequestPage } from '@/features/aeroblood/pages/hospital/NewRequestPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/hospital/new-request')({
  head: () => portalHead('New Request', 'AERO-BLOOD hospital portal: new request and clinical emergency network operations.'),
  component: NewRequestPage,
});
