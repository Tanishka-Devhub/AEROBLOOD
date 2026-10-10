import { createFileRoute } from '@tanstack/react-router';
import { HospitalsDirectoryPage } from '@/features/aeroblood/pages/admin/HospitalsDirectoryPage';
import { portalHead } from '@/features/aeroblood/route-head';

export const Route = createFileRoute('/admin/hospitals')({
  head: () => portalHead('Hospitals Directory', 'AERO-BLOOD admin portal: hospitals directory and clinical emergency network operations.'),
  component: HospitalsDirectoryPage,
});
