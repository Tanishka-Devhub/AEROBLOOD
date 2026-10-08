// ==========================================
// AERO-BLOOD Production API Type Definitions
// Direct mapping from FastAPI backend schemas
// ==========================================

export type BloodRequestPriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type BloodRequestStatus = 'PENDING' | 'PARTIALLY_ALLOCATED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
export type DoctorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BloodUnitStatus = 'AVAILABLE' | 'RESERVED' | 'ALLOCATED' | 'USED' | 'EXPIRED' | 'DISCARDED';
export type AllocationStatus = 'RESERVED' | 'ALLOCATED' | 'ISSUED' | 'CANCELLED';
export type AllocationDecisionStatus = 'FULLY_ALLOCATABLE' | 'PARTIALLY_ALLOCATABLE' | 'NOT_ALLOCATABLE';
export type BloodTransferStatus = 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export type BloodBankStatus = 'ACTIVE' | 'INACTIVE';
export type HospitalStatus = 'ACTIVE' | 'INACTIVE';
export type StaffRole = 'DOCTOR' | 'NURSE' | 'COORDINATOR' | 'LAB_STAFF' | 'BLOOD_BANK_STAFF' | 'ADMIN';
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type DonationEligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE';
export type DonationScreeningStatus = 'PENDING' | 'PASSED' | 'FAILED';
export type ExpiryStatus = 'EXPIRED' | 'CRITICAL' | 'EXPIRING_SOON';
export type InventoryStatus = 'SHORTAGE' | 'BALANCED' | 'SURPLUS';

export interface BloodGroup {
  blood_group_id: number;
  group_name: string;
}

export interface BloodBank {
  blood_bank_id: number;
  name: string;
  address: string;
  city: string;
  phone?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status: BloodBankStatus;
}

export interface Hospital {
  hospital_id: number;
  name: string;
  address: string;
  city: string;
  phone?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status: HospitalStatus;
}

export interface HospitalStaff {
  staff_id: number;
  hospital_id: number;
  full_name: string;
  role: StaffRole;
  license_or_employee_id: string;
  phone: string;
  email?: string | null;
  status: StaffStatus;
}

export interface Donor {
  donor_id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group_id: number;
  phone: string;
  email?: string | null;
  address?: string | null;
  registration_date: string;
  status: string;
  blood_group: BloodGroup;
}

export interface Donation {
  donation_id: number;
  donor_id: number;
  blood_bank_id: number;
  blood_group_id: number;
  donation_date: string;
  eligibility_status: DonationEligibilityStatus;
  screening_status: DonationScreeningStatus;
  remarks?: string | null;
}

export interface BloodUnit {
  unit_id: number;
  donation_id: number;
  blood_bank_id: number;
  collection_date: string;
  expiry_date: string;
  status: BloodUnitStatus;
}

export interface BloodRequest {
  request_id: number;
  hospital_id: number;
  patient_reference: string;
  blood_group_id: number;
  quantity_required: number;
  requested_by_staff_id: number;
  attending_doctor_id: number;
  doctor_approval_status: DoctorApprovalStatus;
  doctor_approved_at?: string | null;
  request_date: string;
  required_by: string;
  priority: BloodRequestPriority;
  status: BloodRequestStatus;
}

export interface BloodRequestCreate {
  hospital_id: number;
  patient_reference: string;
  blood_group_id: number;
  quantity_required: number;
  requested_by_staff_id: number;
  attending_doctor_id: number;
  doctor_approval_status?: DoctorApprovalStatus;
  doctor_approved_at?: string | null;
  required_by: string;
  priority?: BloodRequestPriority;
  status?: BloodRequestStatus;
}

export interface Allocation {
  allocation_id: number;
  request_id: number;
  unit_id: number;
  source_blood_bank_id: number;
  allocated_by_staff_id: number;
  allocated_at: string;
  status: AllocationStatus;
}

export interface BloodTransfer {
  transfer_id: number;
  unit_id: number;
  source_blood_bank_id: number;
  destination_blood_bank_id: number;
  transfer_date: string;
  reason: string;
  approved_by_staff_id?: number | null;
  status: BloodTransferStatus;
}

export interface BloodCompatibility {
  compatibility_id: number;
  donor_blood_group_id: number;
  recipient_blood_group_id: number;
  is_compatible: boolean;
}

// ==========================================
// Intelligence Engine Schemas
// ==========================================

export interface AllocationCandidate {
  unit_id: number;
  donation_id: number;
  blood_bank_id: number;
  donor_blood_group_id: number;
  collection_date: string;
  expiry_date: string;
  status: string;
}

export interface AllocationPreviewResponse {
  request_id: number;
  recipient_blood_group_id: number;
  quantity_required: number;
  quantity_allocated: number;
  allocation_status: AllocationDecisionStatus;
  is_fully_allocatable: boolean;
  selected_unit_ids: number[];
  candidates: AllocationCandidate[];
}

export interface ExpiringUnit {
  unit_id: number;
  donation_id: number;
  blood_bank_id: number;
  collection_date: string;
  expiry_date: string;
  current_status: string;
  expiry_status: ExpiryStatus;
  days_left: number;
}

export interface ExpiryPreviewResponse {
  warning_days: number;
  critical_days: number;
  counts: {
    expired: number;
    critical: number;
    expiring_soon: number;
    total_flagged: number;
  };
  flagged_units: ExpiringUnit[];
}

export interface ExpiryQuarantineResponse {
  units_changed: number;
  changed_unit_ids: number[];
}

export interface BloodGroupStockReport {
  blood_group_id: number;
  group_name: string;
  usable_units: number;
  min_threshold: number;
  surplus_threshold: number;
  status: InventoryStatus;
  shortfall: number;
  excess: number;
}

export interface ShortageSurplusResponse {
  blood_bank_id: number;
  blood_bank_name: string;
  summary: {
    total_usable_units: number;
    shortage_groups_count: number;
    balanced_groups_count: number;
    surplus_groups_count: number;
    has_critical_shortage: boolean;
  };
  stock_by_group: BloodGroupStockReport[];
}

export interface ProposedTransfer {
  unit_id: number;
  donor_blood_group: string;
  recipient_blood_group: string;
  source_blood_bank_id: number;
  source_blood_bank_name: string;
  destination_blood_bank_id: number;
  destination_blood_bank_name: string;
  distance_km: number;
  arrival_date: string;
  estimated_arrival_date: string;
  expiry_date: string;
  days_until_expiry: number;
  reason: string;
}

export interface UnmetShortage {
  destination_blood_bank_id: number;
  destination_blood_bank_name: string;
  blood_group_name: string;
  remaining_shortfall: number;
}

export interface RedistributionPreviewResponse {
  total_transfers_recommended: number;
  total_units_transferred: number;
  unmet_shortages_count: number;
  transfers: ProposedTransfer[];
  unmet_shortages: UnmetShortage[];
}

export interface DonorRecommendationItem {
  rank: number;
  donor_id: number;
  blood_group: string;
  match_type: string;
  match_score: number;
  days_since_last_donation?: number | null;
  recency_score: number;
  distance_km?: number | null;
  estimated_arrival_minutes?: number | null;
  response_time_score: number;
  final_score: number;
  recommendation_reason: string;
}

export interface DonorRankingPreviewResponse {
  request_id: number;
  hospital_id: number;
  hospital_name: string;
  required_blood_group: string;
  priority: string;
  donors_found: number;
  recommendations: DonorRecommendationItem[];
  message?: string | null;
}
