import { createFileRoute } from '@tanstack/react-router';
import { DonorIntelligencePage } from '@/features/aeroblood/pages/bloodbank/DonorIntelligencePage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/donor-intelligence')({
  head: () => portalHead('Donor Intelligence', 'AERO-BLOOD bloodbank portal: donor intelligence and clinical emergency network operations.'),
  component: DonorIntelligencePage,
});
