import { createFileRoute } from '@tanstack/react-router';
import { HospitalAllocationIntelligencePage } from '@/features/aeroblood/pages/hospital/HospitalAllocationIntelligencePage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/hospital/allocation-intelligence')({
  head: () => portalHead('Hospital Allocation Intelligence', 'AERO-BLOOD hospital portal: hospital allocation intelligence and clinical emergency network operations.'),
  component: HospitalAllocationIntelligencePage,
});
