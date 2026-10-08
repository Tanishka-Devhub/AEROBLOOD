import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodGroupsApi } from '../../api';
import type { BloodGroup } from '../../types/api';
import { Droplet } from 'lucide-react';

export const BloodGroupsPage: React.FC = () => {
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await bloodGroupsApi.getAll();
        setBloodGroups(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve blood groups');
      } finally {
        setIsLoading(false);
      }
    };
    loadGroups();
  }, []);

  return (
    <AeroShell
      title="ABO & Rh Blood Group Classifications"
      subtitle="Authoritative biological blood group taxonomy registered in BloodGroup table"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {bloodGroups.map((g) => (
            <div
              key={g.blood_group_id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Group ID #{g.blood_group_id}
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">
                  {g.group_name}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">
                  {g.group_name === 'O-'
                    ? 'Universal Red Cell Donor'
                    : g.group_name === 'AB+'
                    ? 'Universal Red Cell Recipient'
                    : 'Antigen Specified'}
                </div>
              </div>
              <BloodGroupBadge group={g.group_name} size="lg" />
            </div>
          ))}
        </div>
      )}
    </AeroShell>
  );
};
