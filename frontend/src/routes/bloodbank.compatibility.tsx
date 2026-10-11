import { createFileRoute } from '@tanstack/react-router';
import { BloodCompatibilityPage } from '@/features/aeroblood/pages/bloodbank/BloodCompatibilityPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/compatibility')({
  head: () => portalHead('Blood Compatibility', 'AERO-BLOOD bloodbank portal: blood compatibility and clinical emergency network operations.'),
  component: BloodCompatibilityPage,
});
