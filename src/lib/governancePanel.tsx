import { useState } from 'react';
import type { GovernanceRules } from './auditEngine';

type Control = { id: string; label: string; tier: 'A' | 'B' | 'C'; requirement: string; method: string };

export const TYPE_CONTROLS: Record<string, Control[]> = {
  Incident: [
    { id: 'INC-A1', label: 'SLA response compliance', tier: 'A', requirement: 'Structured SLA response status and source timing record', method: 'Automated structured evidence check' },
    { id: 'INC-A2', label: 'Escalation procedure documented', tier: 'A', requirement: 'Identifiable escalation/activity record reviewed against the procedure', method: 'Automated structured evidence check' },
    { id: 'INC-B1', label: 'Root cause documentation', tier: 'B', requirement: 'Identifiable root-cause record with reviewed supporting content', method: 'Automated structured evidence check' },
    { id: 'INC-C1', label: 'Resolution effectiveness', tier: 'C', requirement: 'Auditor evaluates resolution and subsequent service outcome', method: 'Human judgement — required' },
  ],
  'Change Request': [
    { id: 'CHG-A1', label: 'Change authorization evidence', tier: 'A', requirement: 'CAB/authorisation record, reference and independent review state', method: 'Automated structured evidence check' },
    { id: 'CHG-A2', label: 'Pre-implementation review', tier: 'A', requirement: 'Reviewed change scope, risk and implementation plan', method: 'Automated structured evidence check' },
    { id: 'CHG-B1', label: 'Post-implementation verification', tier: 'B', requirement: 'Reviewed post-change validation results and reference', method: 'Automated structured evidence check' },
    { id: 'CHG-C1', label: 'Change impact assessment quality', tier: 'C', requirement: 'Auditor evaluates the impact assessment and residual risk', method: 'Human judgement — required' },
  ],
  'Service Request': [
    { id: 'SR-A1', label: 'SLA fulfilment compliance', tier: 'A', requirement: 'Structured SLA fulfilment status and timing record', method: 'Automated structured evidence check' },
    { id: 'SR-B1', label: 'Fulfilment documentation', tier: 'B', requirement: 'Reviewed fulfilment evidence and acceptance record', method: 'Automated structured evidence check' },
    { id: 'SR-B2', label: 'Approval evidence', tier: 'B', requirement: 'Required approval reference and reviewed source record', method: 'Automated structured evidence check' },
    { id: 'SR-C1', label: 'Service delivery quality', tier: 'C', requirement: 'Auditor evaluates delivery quality and requester outcome', method: 'Human judgement — required' },
  ],
};

type NumKey = Exclude<keyof GovernanceRules, 'treatFairQualityAsException'>;
const LABELS: Record<NumKey, string> = {
  slaPenalty: 'SLA failure penalty',
  approvalPenalty: 'Missing-approval failure penalty',
  documentationPenalty: 'Documented-control failure penalty',
  poorQualityPenalty: 'Poor resolution quality penalty',
  fairQualityPenalty: 'Fair resolution quality penalty',
  documentationMinLength: 'Minimum documentation length (characters)',
  lowThreshold: 'Low provisional risk threshold',
  mediumThreshold: 'Medium provisional risk threshold',
  highThreshold: 'High provisional risk threshold',
};
const FIELDS_FOR: Record<string, NumKey[]> = {
  Incident: ['slaPenalty', 'documentationPenalty', 'poorQualityPenalty', 'fairQualityPenalty', 'documentationMinLength', 'lowThreshold', 'mediumThreshold', 'highThreshold'],
  'Change Request': ['approvalPenalty', 'documentationPenalty', 'poorQualityPenalty', 'fairQualityPenalty', 'documentationMinLength', 'lowThreshold', 'mediumThreshold', 'highThreshold'],
  'Service Request': ['slaPenalty', 'approvalPenalty', 'documentationPenalty', 'poorQualityPenalty', 'fairQualityPenalty', 'documentationMinLength', 'lowThreshold', 'mediumThreshold', 'highThreshold'],
};

export function TicketTypeGovernance({ rules, save }: { rules: GovernanceRules; save: (rules: GovernanceRules, reason: string) => void }) {
  const [type, setType] = useState('Incident');
  const [draft, setDraft] = useState<GovernanceRules>(rules);
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState<{ label: string; previous: number; next: number }[] | null>(null);
  const fields = FIELDS_FOR[type];
  const set = (key: NumKey, v: number) => setDraft(d => ({ ...d, [key]: v }));
  const allKeys = Object.keys(LABELS) as NumKey[];
  const numericValid = allKeys.every(k => Number.isInteger(draft[k]) && draft[k] >= 0 && draft[k] <= (k === 'documentationMinLength' ? 200 : 100));
  const thresholdValid = draft.highThreshold > 0 && draft.highThreshold < draft.mediumThreshold && draft.mediumThreshold < draft.lowThreshold;
  const valid = numericValid && thresholdValid;
  const message = !numericValid ? 'Every value must be a whole number from 0 to 100 (documentation length up to 200).' : !thresholdValid ? 'Invalid threshold configuration: High must be lower than Medium, and Medium lower than Low.' : '';
  const changed = allKeys.filter(k => draft[k] !== rules[k]);
  const onSave = () => {
    if (!valid || !reason.trim() || !changed.length) return;
    setSaved(changed.map(k => ({ label: LABELS[k], previous: rules[k], next: draft[k] })));
    save(draft, reason.trim());
    setReason('');
  };
  return (
    <section className="panel governance">
      <h2>Ticket-type governance controls</h2>
      <p className="governance-help">Twelve representative controls, four per ticket type. This does not claim the full 28-check framework is implemented. Pilot QC routing settings require NTT confirmation.</p>
      <label>Ticket type
        <select className="rv-sel" value={type} onChange={e => setType(e.target.value)}>{Object.keys(TYPE_CONTROLS).map(t => <option key={t}>{t}</option>)}</select>
      </label>
      <div className="table-wrap">
        <table className="rv-tbl">
          <thead><tr><th>RULE ID / CRITERION</th><th>TIER</th><th>EVIDENCE REQUIREMENT</th><th>METHOD</th><th>APPLICABLE / ENABLED</th><th>VERSION</th></tr></thead>
          <tbody>
            {TYPE_CONTROLS[type].map(c => (
              <tr key={c.id}>
                <td><b>{c.id}</b><br /><span style={{ color: '#64748b' }}>· {c.label}</span></td>
                <td>{c.tier}</td>
                <td>{c.requirement}</td>
                <td>{c.method}</td>
                <td>{c.tier === 'C' ? `${type} · required` : <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked readOnly disabled /> {type}</label>}</td>
                <td>v1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rv-note" style={{ marginTop: 14 }}>Provisional risk and evidence completeness are separate. A Tier A failure or a behavioural cue is not hidden by an evidence gap. Tier C is always human-assessed.</div>
      <div className="gov-grid">
        {fields.map(k => (
          <label key={k}>{LABELS[k]}
            <input type="number" min={0} max={k === 'documentationMinLength' ? 200 : 100} step={1} value={Number.isFinite(draft[k]) ? draft[k] : ''} onChange={e => set(k, e.currentTarget.value === '' ? Number.NaN : e.currentTarget.valueAsNumber)} />
          </label>
        ))}
      </div>
      <p className="governance-help">Penalty weights and thresholds apply to all ticket types; the fields shown are the ones that affect the selected type. Per-control on/off switches, Isolation Forest and routine QC sampling settings belong to the evidence-based engine and are not part of this build.</p>
      <label>Change reason
        <input type="text" className="rv-sel" value={reason} placeholder="Why is this change needed? (recorded in the audit trail)" onChange={e => setReason(e.target.value)} />
      </label>
      {message ? <p className="governance-error" role="alert">{message}</p> : null}
      <button className="primary" disabled={!valid || !reason.trim() || !changed.length} onClick={onSave}>Save rules and recalculate</button>
      {saved ? <div className="governance-summary"><b>Governance Update</b><span>Risk scores recalculated and recorded in the audit trail.</span>{saved.map(c => <p key={c.label}>Updated: <b>{c.label}</b> · Previous: {c.previous} · New: {c.next}</p>)}</div> : null}
      <style>{`.gov-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px 16px;margin:14px 0}.gov-grid label{font-weight:600;font-size:13px;display:flex;flex-direction:column;gap:6px}.gov-grid input{padding:12px;border:1px solid #cbd5e1;border-radius:8px;font:inherit}`}</style>
    </section>
  );
}
