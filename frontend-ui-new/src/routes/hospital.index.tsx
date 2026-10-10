import { createFileRoute } from '@tanstack/react-router';
import { HospitalDashboard } from '@/features/aeroblood/pages/hospital/HospitalDashboard';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/hospital/')({
  head: () => portalHead('Hospital Dashboard', 'AERO-BLOOD hospital portal: hospital dashboard and clinical emergency network operations.'),
  component: HospitalDashboard,
});
