import { createFileRoute } from '@tanstack/react-router';
import { InventoryPage } from '@/features/aeroblood/pages/bloodbank/InventoryPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/bloodbank/inventory')({
  head: () => portalHead('Inventory', 'AERO-BLOOD bloodbank portal: inventory and clinical emergency network operations.'),
  component: InventoryPage,
});
