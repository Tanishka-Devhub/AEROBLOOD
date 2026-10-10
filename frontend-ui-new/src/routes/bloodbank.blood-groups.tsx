import { createFileRoute } from '@tanstack/react-router';
import { BloodGroupsPage } from '@/features/aeroblood/pages/bloodbank/BloodGroupsPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/blood-groups')({
  head: () => portalHead('Blood Groups', 'AERO-BLOOD bloodbank portal: blood groups and clinical emergency network operations.'),
  component: BloodGroupsPage,
});
