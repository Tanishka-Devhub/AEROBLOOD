import { createFileRoute } from '@tanstack/react-router';
import { BloodBankCommandCenter } from '@/features/aeroblood/pages/bloodbank/BloodBankCommandCenter';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/')({
  head: () => portalHead('Blood Bank Command Center', 'AERO-BLOOD bloodbank portal: blood bank command center and clinical emergency network operations.'),
  component: BloodBankCommandCenter,
});
