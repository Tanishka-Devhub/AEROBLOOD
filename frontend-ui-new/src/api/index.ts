// ==========================================
// AERO-BLOOD Centralized API Functions
// All calls match FastAPI endpoints exactly
// ==========================================

import { apiClient } from './client';
import type {
  Allocation,
  AllocationPreviewResponse,
  BloodBank,
  BloodCompatibility,
  BloodGroup,
  BloodRequest,
  BloodRequestCreate,
  BloodTransfer,
  BloodUnit,
  BloodUnitStatus,
  Donation,
  Donor,
  DonorRankingPreviewResponse,
  ExpiryPreviewResponse,
  ExpiryQuarantineResponse,
  Hospital,
  HospitalStaff,
  RedistributionPreviewResponse,
  ShortageSurplusResponse,
} from '../types/api';

// ------------------------------------------
// 1. Health & Diagnostics
// ------------------------------------------
export const healthApi = {
  check: () => apiClient.get<{ status: string }>('/health'),
  testDb: () => apiClient.get<{ message?: string; status?: string }>('/db-test'),
};

// ------------------------------------------
// 2. Blood Groups
// ------------------------------------------
export const bloodGroupsApi = {
  getAll: () => apiClient.get<BloodGroup[]>('/blood-groups'),
  getById: (id: number) => apiClient.get<BloodGroup>(`/blood-groups/${id}`),
  getByName: (name: string) => apiClient.get<BloodGroup>(`/blood-groups/name/${name}`),
};

// ------------------------------------------
// 3. Hospitals & Staff
// ------------------------------------------
export const hospitalsApi = {
  getAll: (params?: { limit?: number; offset?: number; city?: string; status?: string }) =>
    apiClient.get<Hospital[]>('/hospitals', params),
  getById: (id: number) => apiClient.get<Hospital>(`/hospitals/${id}`),
};

export const hospitalStaffApi = {
  getAll: (params?: { hospital_id?: number; role?: string; status?: string; name?: string; limit?: number; offset?: number }) =>
    apiClient.get<HospitalStaff[]>('/hospital-staff', params),
  getById: (id: number) => apiClient.get<HospitalStaff>(`/hospital-staff/${id}`),
};

// ------------------------------------------
// 4. Blood Banks
// ------------------------------------------
export const bloodBanksApi = {
  getAll: (params?: { limit?: number; offset?: number; city?: string; status?: string }) =>
    apiClient.get<BloodBank[]>('/blood-banks', params),
  getById: (id: number) => apiClient.get<BloodBank>(`/blood-banks/${id}`),
};

// ------------------------------------------
// 5. Donors & Donations
// ------------------------------------------
export const donorsApi = {
  getAll: (params?: { limit?: number; offset?: number; blood_group_id?: number; status?: string; name?: string }) =>
    apiClient.get<Donor[]>('/donors', params),
  getById: (id: number) => apiClient.get<Donor>(`/donors/${id}`),
};

export const donationsApi = {
  getAll: (params?: { limit?: number; offset?: number; donor_id?: number; blood_bank_id?: number; blood_group_id?: number; eligibility_status?: string; screening_status?: string }) =>
    apiClient.get<Donation[]>('/donations', params),
  getById: (id: number) => apiClient.get<Donation>(`/donations/${id}`),
};

// ------------------------------------------
// 6. Blood Units
// ------------------------------------------
export const bloodUnitsApi = {
  getAll: (params?: { limit?: number; offset?: number; status?: BloodUnitStatus; blood_bank_id?: number }) =>
    apiClient.get<BloodUnit[]>('/blood-units', params),
  getById: (id: number) => apiClient.get<BloodUnit>(`/blood-units/${id}`),
  updateStatus: (id: number, status: BloodUnitStatus) =>
    apiClient.patch<BloodUnit>(`/blood-units/${id}/status`, { status }),
};

// ------------------------------------------
// 7. Blood Requests
// ------------------------------------------
export const bloodRequestsApi = {
  getAll: (params?: {
    hospital_id?: number;
    blood_group_id?: number;
    requested_by_staff_id?: number;
    attending_doctor_id?: number;
    doctor_approval_status?: string;
    priority?: string;
    status?: string;
    patient_reference?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get<BloodRequest[]>('/blood-requests', params),
  getById: (id: number) => apiClient.get<BloodRequest>(`/blood-requests/${id}`),
  create: (data: BloodRequestCreate) => apiClient.post<BloodRequest>('/blood-requests', data),
};

// ------------------------------------------
// 8. Allocations
// ------------------------------------------
export const allocationsApi = {
  getAll: (params?: {
    request_id?: number;
    unit_id?: number;
    source_blood_bank_id?: number;
    allocated_by_staff_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get<Allocation[]>('/allocations', params),
  getById: (id: number) => apiClient.get<Allocation>(`/allocations/${id}`),
};

// ------------------------------------------
// 9. Blood Transfers
// ------------------------------------------
export const bloodTransfersApi = {
  getAll: (params?: {
    unit_id?: number;
    source_blood_bank_id?: number;
    destination_blood_bank_id?: number;
    approved_by_staff_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get<BloodTransfer[]>('/blood-transfers', params),
  getById: (id: number) => apiClient.get<BloodTransfer>(`/blood-transfers/${id}`),
};

// ------------------------------------------
// 10. Blood Compatibility
// ------------------------------------------
export const bloodCompatibilityApi = {
  getAll: (params?: {
    donor_blood_group_id?: number;
    recipient_blood_group_id?: number;
    is_compatible?: boolean;
    limit?: number;
    offset?: number;
  }) => apiClient.get<BloodCompatibility[]>('/blood-compatibility', params),
  getById: (id: number) => apiClient.get<BloodCompatibility>(`/blood-compatibility/${id}`),
};

// ------------------------------------------
// 11. Intelligence Engines
// ------------------------------------------
export const intelligenceApi = {
  // Allocation Engine Preview
  previewAllocation: (requestId: number) =>
    apiClient.post<AllocationPreviewResponse>('/allocation-engine/preview', { request_id: requestId }),

  // Expiry Engine Preview & Quarantine
  previewExpiry: (warningDays?: number, criticalDays?: number) =>
    apiClient.post<ExpiryPreviewResponse>('/expiry-engine/preview', {
      ...(warningDays !== undefined ? { warning_days: warningDays } : {}),
      ...(criticalDays !== undefined ? { critical_days: criticalDays } : {}),
    }),
  quarantineExpired: (unitIds?: number[]) =>
    apiClient.post<ExpiryQuarantineResponse>('/expiry-engine/quarantine', {
      ...(unitIds !== undefined ? { unit_ids: unitIds } : {}),
    }),

  // Shortage & Surplus Engine Preview
  previewShortageSurplus: (bloodBankId: number) =>
    apiClient.post<ShortageSurplusResponse>('/shortage-surplus-engine/preview', { blood_bank_id: bloodBankId }),

  // Redistribution Engine Preview
  previewRedistribution: (data: {
    destination_blood_bank_id: number;
    source_blood_bank_id?: number | null;
    max_transfers?: number;
    speed_kmph?: number;
    expiry_margin_days?: number;
  }) => apiClient.post<RedistributionPreviewResponse>('/redistribution-engine/preview', data),

  // Adaptive Donor Ranking Engine Preview
  previewDonorRanking: (data: { request_id: number; top_n?: number }) =>
    apiClient.post<DonorRankingPreviewResponse>('/donor-ranking-engine/preview', data),
};
