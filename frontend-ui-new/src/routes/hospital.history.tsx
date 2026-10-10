import { createFileRoute } from '@tanstack/react-router';
import { RequestHistoryPage } from '@/features/aeroblood/pages/hospital/RequestHistoryPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/hospital/history')({
  head: () => portalHead('Request History', 'AERO-BLOOD hospital portal: request history and clinical emergency network operations.'),
  component: RequestHistoryPage,
});
