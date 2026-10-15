import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 1. Public Landing Page
import { LandingPage } from './pages/LandingPage';

// 2. Hospital Portal Pages
import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { NewRequestPage } from './pages/hospital/NewRequestPage';
import { EmergencyRequestPage } from './pages/hospital/EmergencyRequestPage';
import { MyRequestsPage } from './pages/hospital/MyRequestsPage';
import { RequestHistoryPage } from './pages/hospital/RequestHistoryPage';
import { HospitalAllocationIntelligencePage } from './pages/hospital/HospitalAllocationIntelligencePage';
import { HospitalProfilePage } from './pages/hospital/HospitalProfilePage';

// 3. Blood Bank Portal Pages
import { BloodBankCommandCenter } from './pages/bloodbank/BloodBankCommandCenter';
import { InventoryPage } from './pages/bloodbank/InventoryPage';
import { BankRequestsPage } from './pages/bloodbank/BankRequestsPage';
import { ExpiryRadarPage } from './pages/bloodbank/ExpiryRadarPage';
import { QuarantinePage } from './pages/bloodbank/QuarantinePage';
import { ShortageSurplusPage } from './pages/bloodbank/ShortageSurplusPage';
import { RedistributionPage } from './pages/bloodbank/RedistributionPage';
import { DonorIntelligencePage } from './pages/bloodbank/DonorIntelligencePage';
import { BankAllocationIntelligencePage } from './pages/bloodbank/BankAllocationIntelligencePage';
import { DonorsPage } from './pages/bloodbank/DonorsPage';
import { DonationsPage } from './pages/bloodbank/DonationsPage';
import { BloodTransfersPage } from './pages/bloodbank/BloodTransfersPage';
import { BloodGroupsPage } from './pages/bloodbank/BloodGroupsPage';
import { BloodCompatibilityPage } from './pages/bloodbank/BloodCompatibilityPage';
import { BloodBankProfilePage } from './pages/bloodbank/BloodBankProfilePage';

// 4. Admin Portal Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { NetworkInventoryPage } from './pages/admin/NetworkInventoryPage';
import { HospitalsDirectoryPage } from './pages/admin/HospitalsDirectoryPage';
import { BloodBanksDirectoryPage } from './pages/admin/BloodBanksDirectoryPage';
import { AdminEmergencyOverviewPage } from './pages/admin/AdminEmergencyOverviewPage';
import { AdminShortageNetworkPage } from './pages/admin/AdminShortageNetworkPage';
import { AdminRedistributionNetworkPage } from './pages/admin/AdminRedistributionNetworkPage';
import { AdminDonorIntelligencePage } from './pages/admin/AdminDonorIntelligencePage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminAllocationsPage } from './pages/admin/AdminAllocationsPage';
import { AdminTransfersPage } from './pages/admin/AdminTransfersPage';
import { SystemHealthPage } from './pages/admin/SystemHealthPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Hospital Portal Routes */}
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/hospital/new-request" element={<NewRequestPage />} />
        <Route path="/hospital/emergency" element={<EmergencyRequestPage />} />
        <Route path="/hospital/requests" element={<MyRequestsPage />} />
        <Route path="/hospital/history" element={<RequestHistoryPage />} />
        <Route
          path="/hospital/allocation-intelligence"
          element={<HospitalAllocationIntelligencePage />}
        />
        <Route path="/hospital/profile" element={<HospitalProfilePage />} />

        {/* Blood Bank Portal Routes */}
        <Route path="/bloodbank" element={<BloodBankCommandCenter />} />
        <Route path="/bloodbank/inventory" element={<InventoryPage />} />
        <Route path="/bloodbank/requests" element={<BankRequestsPage />} />
        <Route path="/bloodbank/expiry" element={<ExpiryRadarPage />} />
        <Route path="/bloodbank/quarantine" element={<QuarantinePage />} />
        <Route path="/bloodbank/shortage-surplus" element={<ShortageSurplusPage />} />
        <Route path="/bloodbank/redistribution" element={<RedistributionPage />} />
        <Route path="/bloodbank/donor-intelligence" element={<DonorIntelligencePage />} />
        <Route
          path="/bloodbank/allocation-preview"
          element={<BankAllocationIntelligencePage />}
        />
        <Route path="/bloodbank/donors" element={<DonorsPage />} />
        <Route path="/bloodbank/donations" element={<DonationsPage />} />
        <Route path="/bloodbank/transfers" element={<BloodTransfersPage />} />
        <Route path="/bloodbank/blood-groups" element={<BloodGroupsPage />} />
        <Route path="/bloodbank/compatibility" element={<BloodCompatibilityPage />} />
        <Route path="/bloodbank/profile" element={<BloodBankProfilePage />} />

        {/* Admin Portal Routes */}
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/inventory" element={<NetworkInventoryPage />} />
        <Route path="/admin/hospitals" element={<HospitalsDirectoryPage />} />
        <Route path="/admin/bloodbanks" element={<BloodBanksDirectoryPage />} />
        <Route path="/admin/emergency" element={<AdminEmergencyOverviewPage />} />
        <Route path="/admin/shortage-network" element={<AdminShortageNetworkPage />} />
        <Route
          path="/admin/redistribution-network"
          element={<AdminRedistributionNetworkPage />}
        />
        <Route path="/admin/donor-intelligence" element={<AdminDonorIntelligencePage />} />
        <Route path="/admin/requests" element={<AdminRequestsPage />} />
        <Route path="/admin/allocations" element={<AdminAllocationsPage />} />
        <Route path="/admin/transfers" element={<AdminTransfersPage />} />
        <Route path="/admin/health" element={<SystemHealthPage />} />

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
