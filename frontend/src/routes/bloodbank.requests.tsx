import { createFileRoute } from '@tanstack/react-router';
import { BankRequestsPage } from '@/features/aeroblood/pages/bloodbank/BankRequestsPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/requests')({
  head: () => portalHead('Bank Requests', 'AERO-BLOOD bloodbank portal: bank requests and clinical emergency network operations.'),
  component: BankRequestsPage,
});
