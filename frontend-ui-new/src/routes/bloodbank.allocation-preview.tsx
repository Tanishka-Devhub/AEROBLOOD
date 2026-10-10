import { createFileRoute } from '@tanstack/react-router';
import { BankAllocationIntelligencePage } from '@/features/aeroblood/pages/bloodbank/BankAllocationIntelligencePage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/allocation-preview')({
  head: () => portalHead('Bank Allocation Intelligence', 'AERO-BLOOD bloodbank portal: bank allocation intelligence and clinical emergency network operations.'),
  component: BankAllocationIntelligencePage,
});
