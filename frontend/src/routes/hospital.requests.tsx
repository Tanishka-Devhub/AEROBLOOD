import { createFileRoute } from '@tanstack/react-router';
import { MyRequestsPage } from '@/features/aeroblood/pages/hospital/MyRequestsPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/hospital/requests')({
  head: () => portalHead('My Requests', 'AERO-BLOOD hospital portal: my requests and clinical emergency network operations.'),
  component: MyRequestsPage,
});
