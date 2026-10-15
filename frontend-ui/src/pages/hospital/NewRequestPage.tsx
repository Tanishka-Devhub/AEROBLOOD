import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AeroShell } from '../../components/common/AeroShell';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  bloodRequestsApi,
  bloodGroupsApi,
  hospitalsApi,
  hospitalStaffApi,
} from '../../api';
import type {
  BloodGroup,
  Hospital,
  HospitalStaff,
  BloodRequestCreate,
  BloodRequestPriority,
  DoctorApprovalStatus,
  BloodRequest,
} from '../../types/api';
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const NewRequestPage: React.FC = () => {
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Form State
  const [hospitalId, setHospitalId] = useState<number>(1);
  const [patientReference, setPatientReference] = useState('');
  const [bloodGroupId, setBloodGroupId] = useState<number>(1);
  const [quantityRequired, setQuantityRequired] = useState<number>(1);
  const [requestedByStaffId, setRequestedByStaffId] = useState<number>(1);
  const [attendingDoctorId, setAttendingDoctorId] = useState<number>(1);
  const [doctorApprovalStatus, setDoctorApprovalStatus] = useState<DoctorApprovalStatus>('APPROVED');
  const [priority, setPriority] = useState<BloodRequestPriority>('NORMAL');
  const [requiredBy, setRequiredBy] = useState<string>(() => {
    // Default to tomorrow same time in ISO format YYYY-MM-DDTHH:MM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<BloodRequest | null>(null);

  // Load hospitals, blood groups, and staff
  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      setMetadataError(null);
      try {
        const [hospData, groupData, staffData] = await Promise.all([
          hospitalsApi.getAll({ limit: 50 }),
          bloodGroupsApi.getAll(),
          hospitalStaffApi.getAll({ limit: 50 }),
        ]);
        setHospitals(hospData);
        setBloodGroups(groupData);
        setStaffList(staffData);

        if (hospData.length > 0) setHospitalId(hospData[0].hospital_id);
        if (groupData.length > 0) setBloodGroupId(groupData[0].blood_group_id);
        if (staffData.length > 0) {
          setRequestedByStaffId(staffData[0].staff_id);
          const doc = staffData.find((s) => s.role === 'DOCTOR') || staffData[0];
          setAttendingDoctorId(doc.staff_id);
        }
      } catch (err: unknown) {
        setMetadataError(err instanceof Error ? err.message : 'Failed to load form metadata');
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientReference.trim()) {
      setSubmitError('Please provide a valid Patient Reference identifier');
      return;
    }
    if (quantityRequired < 1) {
      setSubmitError('Quantity must be at least 1 unit');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: BloodRequestCreate = {
        hospital_id: Number(hospitalId),
        patient_reference: patientReference.trim(),
        blood_group_id: Number(bloodGroupId),
        quantity_required: Number(quantityRequired),
        requested_by_staff_id: Number(requestedByStaffId),
        attending_doctor_id: Number(attendingDoctorId),
        doctor_approval_status: doctorApprovalStatus,
        required_by: new Date(requiredBy).toISOString(),
        priority: priority,
        status: 'PENDING',
      };

      const result = await bloodRequestsApi.create(payload);
      setCreatedRequest(result);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Requisition submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AeroShell
      title="Create Blood Requisition"
      subtitle="Submit authoritative clinical blood request to the AERO-BLOOD network"
    >
      {isLoadingMetadata ? (
        <LoadingState message="Loading hospital registry & blood group catalogs..." />
      ) : metadataError ? (
        <ErrorState message={metadataError} onRetry={() => window.location.reload()} />
      ) : createdRequest ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm max-w-2xl mx-auto text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Requisition Created Successfully</h2>
            <p className="text-xs text-slate-500 mt-1">
              Registered in MySQL database as Request ID <strong className="font-mono text-slate-900">#{createdRequest.request_id}</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Ref:</span>
              <span className="font-mono font-bold text-slate-800">{createdRequest.patient_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Quantity:</span>
              <span className="font-bold text-slate-800">{createdRequest.quantity_required} Units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Priority:</span>
              <span className="font-bold text-slate-800">{createdRequest.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-700">{createdRequest.status}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setCreatedRequest(null);
                setPatientReference('');
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Submit Another Request
            </button>
            <Link
              to={`/hospital/allocation-intelligence?request_id=${createdRequest.request_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <span>Run Allocation Intelligence</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Clinical Blood Requisition Form</h3>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative input schema enforced by FastAPI backend validation</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Form Validated
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Row 1: Hospital + Patient Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Requesting Hospital *
                </label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  {hospitals.map((h) => (
                    <option key={h.hospital_id} value={h.hospital_id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Patient Reference Identifier *
                </label>
                <input
                  type="text"
                  value={patientReference}
                  onChange={(e) => setPatientReference(e.target.value)}
                  placeholder="e.g. PAT-2026-90412"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Row 2: Blood Group + Units Required */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Blood Group *
                </label>
                <select
                  value={bloodGroupId}
                  onChange={(e) => setBloodGroupId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  {bloodGroups.map((g) => (
                    <option key={g.blood_group_id} value={g.blood_group_id}>
                      {g.group_name} (Group #{g.blood_group_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Units Required (Bags) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quantityRequired}
                  onChange={(e) => setQuantityRequired(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Row 3: Staff & Attending Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Requested By Staff *
                </label>
                <select
                  value={requestedByStaffId}
                  onChange={(e) => setRequestedByStaffId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  {staffList.map((s) => (
                    <option key={s.staff_id} value={s.staff_id}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Attending Doctor *
                </label>
                <select
                  value={attendingDoctorId}
                  onChange={(e) => setAttendingDoctorId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                >
                  {staffList.map((s) => (
                    <option key={s.staff_id} value={s.staff_id}>
                      Dr. {s.full_name} ({s.license_or_employee_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Priority + Required By + Doctor Approval */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Clinical Priority *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as BloodRequestPriority)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="NORMAL">NORMAL (Scheduled surgery / elective)</option>
                  <option value="URGENT">URGENT (Acute care / urgent surgery)</option>
                  <option value="EMERGENCY">EMERGENCY (Trauma / life-critical)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Required By Timestamp *
                </label>
                <input
                  type="datetime-local"
                  value={requiredBy}
                  onChange={(e) => setRequiredBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Doctor Approval Status
                </label>
                <select
                  value={doctorApprovalStatus}
                  onChange={(e) => setDoctorApprovalStatus(e.target.value as DoctorApprovalStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="APPROVED">APPROVED (Verified)</option>
                  <option value="PENDING">PENDING (Awaiting sign-off)</option>
                </select>
              </div>
            </div>

            {priority === 'EMERGENCY' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">EMERGENCY PRIORITY ACTIVATION:</strong>
                  This request will be marked as life-critical. The Allocation and Donor Ranking engines will adapt weights to emphasize response proximity (40%) and trigger immediate multi-bank candidate searches.
                </div>
              </div>
            )}

            {/* Submission Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/hospital')}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                    <span>Transmitting to FastAPI...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Blood Requisition</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </AeroShell>
  );
};
