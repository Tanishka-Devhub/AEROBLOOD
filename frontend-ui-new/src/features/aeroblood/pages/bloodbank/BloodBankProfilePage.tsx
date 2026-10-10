import React, { useEffect, useState } from 'react';
import { AeroShell } from '../../components/common/AeroShell';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { bloodBanksApi } from '../../api';
import type { BloodBank } from '../../types/api';
import { Shield, MapPin, Phone, Building2, CheckCircle2 } from 'lucide-react';

export const BloodBankProfilePage: React.FC = () => {
  const [bank, setBank] = useState<BloodBank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBank = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const banks = await bloodBanksApi.getAll({ limit: 1 });
        if (banks[0] !== undefined) {
          setBank(banks[0]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to retrieve blood bank profile');
      } finally {
        setIsLoading(false);
      }
    };
    loadBank();
  }, []);

  return (
    <AeroShell
      title="Blood Bank Operational Profile"
      subtitle="Regional storage center identification and network credentials"
    >
      {isLoading ? (
        <LoadingState message="Loading facility profile..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : bank ? (
        <div className="bg-card rounded-lg border border-border/90 p-8 shadow-xs max-w-3xl space-y-6">
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-accent border border-primary text-blood-light flex items-center justify-center shrink-0">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-medium text-foreground">{bank.name}</h2>
                  <StatusBadge status={bank.status} size="sm" />
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  Blood Bank ID: #{bank.blood_bank_id} · Regional Storage Hub
                </div>
              </div>
            </div>

            <span className="text-xs font-medium text-clinical bg-accent border border-primary px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-clinical" />
              <span>Accredited</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground block mb-1">
                  Physical Facility Address
                </span>
                <div className="flex items-start gap-2 text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{bank.address}, {bank.city}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground block mb-1">
                  Contact Telephony
                </span>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{bank.phone || 'Standard Central Exchange'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground block mb-1">
                  Geographic Coordinates
                </span>
                <div className="font-mono text-foreground bg-card p-2.5 rounded-lg border border-border">
                  Latitude: {bank.latitude ?? 'Not configured in schema'} <br />
                  Longitude: {bank.longitude ?? 'Not configured in schema'}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-medium text-muted-foreground block mb-1">
                  Operational Responsibilities
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  Whole blood collection, component separation, refrigerated shelf-life quarantine surveillance, and inter-facility emergency transfers.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AeroShell>
  );
};
