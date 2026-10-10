import { createFileRoute } from '@tanstack/react-router';
import { NetworkInventoryPage } from '@/features/aeroblood/pages/admin/NetworkInventoryPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/inventory')({
  head: () => portalHead('Network Inventory', 'AERO-BLOOD admin portal: network inventory and clinical emergency network operations.'),
  component: NetworkInventoryPage,
});
