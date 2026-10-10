import { createFileRoute } from '@tanstack/react-router';
import { QuarantinePage } from '@/features/aeroblood/pages/bloodbank/QuarantinePage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/quarantine')({
  head: () => portalHead('Quarantine', 'AERO-BLOOD bloodbank portal: quarantine and clinical emergency network operations.'),
  component: QuarantinePage,
});
