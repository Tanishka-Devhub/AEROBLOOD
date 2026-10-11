import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, type Column } from '../../components/common/DataTable';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { hospitalsApi, hospitalStaffApi } from '../../api';
import type { Hospital, HospitalStaff } from '../../types/api';
import { Building2, MapPin, Phone, Users, ShieldCheck, Mail } from 'lucide-react';

export const HospitalProfilePage: React.FC = () => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [staff, setStaff] = useState<HospitalStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [hospList, staffList] = await Promise.all([
          hospitalsApi.getAll({ limit: 1 }),
          hospitalStaffApi.getAll({ limit: 50 }),
        ]);

        if (hospList[0] !== undefined) {
          setHospital(hospList[0]);
        }
        setStaff(staffList);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load hospital profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const staffColumns: Column<HospitalStaff>[] = [
    {
      key: 'staff_id',
      header: 'STAFF ID',
      render: (s) => <span className="font-mono font-medium text-foreground">#{s.staff_id}</span>,
    },
    {
      key: 'full_name',
      header: 'STAFF MEMBER',
      render: (s) => (
        <div>
          <span className="font-semibold text-foreground block">{s.full_name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">Lic: {s.license_or_employee_id}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'CLINICAL ROLE',
      render: (s) => (
        <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-accent text-foreground border border-primary">
          {s.role}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'CONTACT',
      render: (s) => (
        <div className="text-xs text-muted-foreground">
          <div>{s.phone}</div>
          {s.email && <div className="text-[10px] text-muted-foreground">{s.email}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (s) => <StatusBadge status={s.status} size="sm" />,
    },
  ];

  return (
    <AeroShell
      title="Hospital Operational Profile"
      subtitle="Institutional facility registry, clinical accreditation, and staff authorization directory"
    >
      {isLoading ? (
        <LoadingState message="Loading hospital facility profile..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : hospital ? (
        <div className="space-y-6">
          {/* Facility Hero Card */}
          <div className="bg-card rounded-lg border border-border/90 p-6 shadow-xs flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-accent border border-primary text-foreground flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-medium text-foreground">{hospital.name}</h2>
                  <StatusBadge status={hospital.status} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {hospital.address}, {hospital.city}
                  </span>
                  {hospital.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {hospital.phone}
                    </span>
                  )}
                  <span className="font-mono text-muted-foreground">
                    ID: #{hospital.hospital_id}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-card rounded-lg border border-border text-right text-xs">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Network Status
              </div>
              <div className="font-medium text-clinical mt-0.5 flex items-center justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Facility</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Coordinates: {hospital.latitude && hospital.longitude ? `${hospital.latitude}, ${hospital.longitude}` : 'Not registered in schema'}
              </div>
            </div>
          </div>

          {/* Authorized Clinical Staff Directory */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-foreground">Authorized Transfusion Staff Directory</h3>
                <p className="text-xs text-muted-foreground">Personnel authenticated to approve requisitions and release blood units</p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {staff.length} Authorized Members
              </span>
            </div>

            <DataTable
              columns={staffColumns}
              data={staff}
              keyField="staff_id"
              searchable
              searchPlaceholder="Search staff by name or license ID..."
              searchFilter={(s, q) =>
                s.full_name.toLowerCase().includes(q.toLowerCase()) ||
                s.license_or_employee_id.toLowerCase().includes(q.toLowerCase()) ||
                s.role.toLowerCase().includes(q.toLowerCase())
              }
              pageSize={10}
            />
          </div>
        </div>
      ) : null}
    </AeroShell>
  );
};
