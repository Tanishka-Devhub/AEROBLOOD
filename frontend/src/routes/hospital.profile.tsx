import { createFileRoute } from '@tanstack/react-router';
import { HospitalProfilePage } from '@/features/aeroblood/pages/hospital/HospitalProfilePage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/hospital/profile')({
  head: () => portalHead('Hospital Profile', 'AERO-BLOOD hospital portal: hospital profile and clinical emergency network operations.'),
  component: HospitalProfilePage,
});
