import type { CSSProperties } from 'react';
import { Building2, Hospital, Check } from 'lucide-react';

type BloodTransferProps = {
  bloodGroup?: string;
  units?: number;
  requestedAt?: string | null;
  completedAt?: string | null;
};

/** Faster fulfilment = faster animation. Maps elapsed hours onto 2.5s–9s. */
export function transferDurationSeconds(requestedAt?: string | null, completedAt?: string | null): number {
  const start = requestedAt ? Date.parse(requestedAt) : NaN;
  const end = completedAt ? Date.parse(completedAt) : NaN;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 4.2;
  const hours = (end - start) / 3_600_000;
  const seconds = 2.5 + Math.min(hours, 24) * (6.5 / 24);
  return Math.round(seconds * 10) / 10;
}

export function BloodTransfer({ bloodGroup, units, requestedAt, completedAt }: BloodTransferProps) {
  const duration = transferDurationSeconds(requestedAt, completedAt);
  const style = { '--transfer-duration': `${duration}s` } as CSSProperties;

  return (
    <section className="blood-transfer" aria-label="Hospital blood transfer" style={style}>
      <div className="transfer-heading">
        <div>
          <span className="transfer-kicker">REQUISITION FULFILLED</span>
          <h3>Bank to bedside.</h3>
        </div>
      </div>
      <div className="transfer-scene is-running" aria-hidden="true">
        <div className="transfer-endpoint"><Building2 /><span>Blood bank</span></div>
        <div className="transfer-channel">
          <svg className="transfer-tube" viewBox="0 0 300 80" preserveAspectRatio="none">
            <path className="transfer-tube-base" d="M0 40 H300" />
            <path className="transfer-tube-flow" d="M0 40 H300" />
          </svg>
          <div className="transfer-packet">
            <svg viewBox="0 0 58 76">
              <path className="transfer-bag" d="M19 7V3h20v4 M14 9h30l6 12v39q0 6-6 6H14q-6 0-6-6V21z" />
              <path className="transfer-bag-fill" d="M12 31q8-5 17 0t17 0v28q0 3-3 3H15q-3 0-3-3z" />
              <rect className="transfer-bag-label" x="17" y="22" width="24" height="26" rx="2" />
              <path className="transfer-bag-cross" d="M29 28v14m-7-7h14" />
              <path className="transfer-bag" d="M24 67v7m10-7v7" />
            </svg>
          </div>
        </div>
        <div className="transfer-endpoint transfer-hospital"><Hospital /><span>Hospital</span><Check className="transfer-arrival" /></div>
      </div>
      <div className="transfer-caption">
        <span role="status" aria-live="polite">Blood received · request fulfilled</span>
        <span className="transfer-specimen">{bloodGroup || 'Blood'}{units !== undefined ? ` · ${units} ${units === 1 ? 'unit' : 'units'}` : ''}</span>
      </div>
    </section>
  );
}
