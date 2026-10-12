import { createFileRoute } from '@tanstack/react-router';
import { EmergencyRequestPage } from '@/features/aeroblood/pages/hospital/EmergencyRequestPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/hospital/emergency')({
  head: () => portalHead('Emergency Request', 'AERO-BLOOD hospital portal: emergency request and clinical emergency network operations.'),
  component: EmergencyRequestPage,
});
