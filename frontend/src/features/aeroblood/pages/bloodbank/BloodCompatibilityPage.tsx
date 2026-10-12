import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { BloodGroupBadge } from '../../components/common/BloodGroupBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodCompatibilityApi, bloodGroupsApi } from '../../api';
import type { BloodCompatibility, BloodGroup } from '../../types/api';
import { Check, X, Split } from 'lucide-react';

export const BloodCompatibilityPage: React.FC = () => {
  const [compatList, setCompatList] = useState<BloodCompatibility[]>([]);
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [compat, groups] = await Promise.all([
          bloodCompatibilityApi.getAll({ limit: 100 }),
          bloodGroupsApi.getAll(),
        ]);
        setCompatList(compat);
        setBloodGroups(groups);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load compatibility matrix');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getCompatibility = (donorId: number, recipientId: number): boolean => {
    const match = compatList.find(
      (c) => c.donor_blood_group_id === donorId && c.recipient_blood_group_id === recipientId
    );
    return match ? match.is_compatible : false;
  };

  return (
    <AeroShell
      title="Authoritative Blood Compatibility Matrix"
      subtitle="Complete 8x8 matrix (64 rows) loaded from MySQL BloodCompatibility table governing allocation safety"
    >
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div className="bg-card rounded-lg border border-border/90 p-6 shadow-xs overflow-x-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-foreground">ABO & Rh Transfusion Matrix</h3>
              <p className="text-xs text-muted-foreground">Rows represent Donor blood group; Columns represent Recipient blood group.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-clinical">
                <span className="w-4 h-4 rounded bg-accent flex items-center justify-center text-clinical">
                  <Check className="w-3 h-3" />
                </span>
                Compatible
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-4 h-4 rounded bg-muted flex items-center justify-center text-muted-foreground">
                  <X className="w-3 h-3" />
                </span>
                Incompatible
              </span>
            </div>
          </div>

          <table className="w-full text-center text-xs">
            <thead>
              <tr>
                <th className="p-3 text-left font-medium text-muted-foreground uppercase text-[10px]">
                  Donor \ Recipient
                </th>
                {bloodGroups.map((recipient) => (
                  <th key={recipient.blood_group_id} className="p-3">
                    <BloodGroupBadge group={recipient.group_name} size="sm" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bloodGroups.map((donor) => (
                <tr key={donor.blood_group_id} className="hover:bg-card/60">
                  <td className="p-3 text-left font-medium">
                    <BloodGroupBadge group={donor.group_name} size="sm" />
                  </td>
                  {bloodGroups.map((recipient) => {
                    const isCompat = getCompatibility(donor.blood_group_id, recipient.blood_group_id);
                    return (
                      <td key={recipient.blood_group_id} className="p-3">
                        {isCompat ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/80 text-clinical border border-primary font-medium shadow-2xs">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground font-medium">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AeroShell>
  );
};
