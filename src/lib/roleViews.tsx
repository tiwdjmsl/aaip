import { useMemo, useState, type ReactNode } from 'react';
import type { AuditAssessment, AuditDecision, AuditTrailEntry, RawTicket } from '../types/audit';
import { stageOf, type Persona, type Role, type StepOutcome, type Workflow } from './roles';
import { checklistFor, evidenceSources, classifySla, classifyApproval } from './assuranceControls';
import type { GovernanceRules } from './auditEngine';
import { type MetricEvent } from './pilotMetrics';

/* Role views modelled on "AAIP Role-Based Views". Prototype: client-side only. */

export type TV = { raw: RawTicket; assessment: AuditAssessment };
type Decisions = Record<string, AuditDecision>;
type Act = (ticketId: string, stage: 'qc' | 'gov' | 'mgmt', outcome: StepOutcome, comment: string) => void;
export type BlindView = 'Compliant' | 'Non-compliant' | 'Escalate';

/* ------------------------------ derived signals ------------------------------ */
export function checklistOf(t: TV) {
  const c = checklistFor(t.raw);
  /* escalation / scope controls count as "documentation" for the roll-up views */
  const items = c.items.map(i => ({ ...i, area: i.area === 'escalation' || i.area === 'scope' ? 'docs' : i.area }));
  const fails = items.filter(i => i.result === 'FAIL');
  const notAssessed = items.filter(i => i.result === 'NOT_ASSESSED');
  const automated = items.filter(i => i.result !== 'JUDGEMENT' && i.result !== 'NOT_APPLICABLE');
  const validated = automated.filter(i => i.evidenceStatus === 'VALIDATED_SUPPORTS' || i.evidenceStatus === 'VALIDATED_CONTRADICTS').length;
  return { ...c, items, fails, notAssessed, pass: !fails.length && !notAssessed.length, coverage: automated.length ? Math.round(100 * validated / automated.length) : 0 };
}
export const failsIn = (t: TV, area: string) => checklistOf(t).items.some(i => i.area === area && i.result === 'FAIL');
export function behaviourOf(t: TV) {
  const finding = t.assessment.findings.find(f => /anomal/i.test(f));
  return { flagged: Boolean(finding) || t.assessment.anomalyDetected, finding };
}
const isHighRisk = (t: TV) => t.assessment.riskLevel === 'High' || t.assessment.riskLevel === 'Critical';
const aiStance = (t: TV): BlindView => (checklistOf(t).fails.length ? 'Non-compliant' : 'Compliant');
/** What the auditor's final decision means in compliant / non-compliant terms. */
export function auditorStance(t: TV, d: AuditDecision | undefined): BlindView | null {
  if (!d || d.status === 'Pending Review') return null;
  if (d.kind === 'Confirmed') return aiStance(t);
  if (d.kind === 'Overridden') return aiStance(t) === 'Compliant' ? 'Non-compliant' : 'Compliant';
  return 'Escalate';
}
const auditorLabel = (d: AuditDecision) => d.kind === 'Confirmed' ? 'Confirmed AI result' : d.kind === 'Overridden' ? `Overridden — “${d.overrideReason ?? 'no reason recorded'}”` : 'Escalated to QC';

/* ------------------------------ styles ------------------------------ */
export const ROLE_CSS = `
.app-shell.rv{display:block!important;min-height:100vh;background:#f4f6f8}
.rv-top{background:#0b1220;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:12px 28px;gap:16px;flex-wrap:wrap}
.rv-brand{display:flex;gap:12px;align-items:center}.rv-brand .mark{background:#0f766e;border-radius:8px;width:34px;height:34px;display:grid;place-items:center;font-weight:700;font-size:13px}
.rv-brand b{display:block;font-size:15px}.rv-brand span{font-size:11px;color:#94a3b8}
.rv-tabs{display:flex;background:#16213a;border-radius:10px;padding:4px;gap:2px}
.rv-tabs button{background:none;border:0;color:#cbd5e1;padding:8px 16px;border-radius:7px;font-weight:600;font-size:13px;cursor:pointer}
.rv-tabs button.on{background:#0f766e;color:#fff}
.rv-user{display:flex;align-items:center;gap:10px;font-size:12px}.rv-user .av{width:30px;height:30px;border-radius:50%;background:#334155;display:grid;place-items:center;font-weight:700;font-size:11px}
.rv-user small{display:block;color:#94a3b8}.rv-user button{background:none;border:1px solid #334155;color:#cbd5e1;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;margin-left:4px}
.rv-demo{background:#fffbeb;border-bottom:1px solid #fde68a;color:#92400e;font-size:12px;padding:7px 28px}
.rv-sub{background:#fff;border-bottom:1px solid #e2e8f0;padding:0 28px;display:flex;gap:4px;overflow-x:auto}
.rv-sub button{background:none;border:0;border-bottom:2px solid transparent;padding:11px 14px;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;white-space:nowrap}
.rv-sub button.on{color:#0f766e;border-bottom-color:#0f766e}
.rv-page{max-width:1240px;margin:0 auto;padding:24px 28px 48px}
.rv-page h1{font-size:26px;margin:0 0 4px;color:#0f172a}.rv-sub-t{color:#64748b;font-size:13px;margin:0 0 18px}
.rv-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.rv-btn{border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:8px;padding:9px 16px;font-weight:600;font-size:13px;cursor:pointer}
.rv-btn.pri{background:#0f766e;border-color:#0f766e;color:#fff}.rv-btn.ind{color:#4338ca;border-color:#c7d2fe}.rv-btn.red{color:#b91c1c;border-color:#fecaca}
.rv-btn:disabled{opacity:.45;cursor:not-allowed}
.rv-grid4{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:14px}
.rv-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px;margin-bottom:14px;align-items:start}
.rv-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin-bottom:14px}
.rv-card h2{font-size:15px;margin:0 0 6px;color:#0f172a}.rv-card h3{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#64748b;margin:0 0 6px}
.rv-card p{font-size:13px;color:#475569;margin:0 0 8px}
.rv-stat small{color:#64748b;font-size:12px}.rv-stat b{display:block;font-size:30px;margin:4px 0}.rv-stat span{font-size:11px;color:#94a3b8}
.rv-pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700}
.rv-pill.amber{background:#fef3c7;color:#b45309}.rv-pill.red{background:#fee2e2;color:#b91c1c}.rv-pill.green{background:#d1fae5;color:#047857}.rv-pill.ind{background:#e0e7ff;color:#4338ca}.rv-pill.grey{background:#f1f5f9;color:#475569}.rv-pill.teal{background:#ccfbf1;color:#0f766e}
.rv-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.rv-row:last-child{border-bottom:0}
.rv-id{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;font-size:13px}
.rv-link{background:none;border:0;color:#0f766e;font-weight:700;font-size:13px;cursor:pointer;padding:0}
.rv-note{background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:12px;margin-bottom:10px;font-size:13px}
.rv-warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:8px;padding:9px 11px;font-size:12px;margin:10px 0}
.rv-tbl{width:100%;border-collapse:collapse;font-size:13px}.rv-tbl th{text-align:left;font-size:11px;letter-spacing:.05em;color:#64748b;padding:8px;border-bottom:1px solid #e2e8f0}
.rv-tbl td{padding:12px 8px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.rv-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.rv-filters button{border:1px solid #e2e8f0;background:#fff;border-radius:99px;padding:6px 14px;font-size:12px;font-weight:600;color:#475569;cursor:pointer}
.rv-filters button.on{background:#0f766e;border-color:#0f766e;color:#fff}
.rv-sig{border-radius:12px;padding:16px;border:1px solid}.rv-sig.ok{background:#ecfdf5;border-color:#a7f3d0}.rv-sig.bad{background:#fef2f2;border-color:#fecaca}.rv-sig.beh{background:#eef2ff;border-color:#c7d2fe}.rv-sig.none{background:#f8fafc;border-color:#e2e8f0}
.rv-sig small{font-size:10px;letter-spacing:.06em;color:#64748b;text-transform:uppercase}.rv-sig b{display:block;font-size:24px;margin:4px 0}
.rv-chk{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.rv-chk .tier{background:#f1f5f9;border-radius:99px;padding:3px 10px;font-size:11px;font-weight:700;color:#475569;min-width:54px;text-align:center}.rv-chk .lbl{flex:1}
.rv-two{display:grid;grid-template-columns:minmax(260px,1fr) minmax(0,2fr);gap:14px;align-items:start}
.rv-sigs{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.rv-kv{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:10px}.rv-kv span{display:block;font-size:10px;letter-spacing:.06em;color:#94a3b8;text-transform:uppercase}
.rv-ta{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;font-size:13px;margin:8px 0;box-sizing:border-box}
.rv-sel{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:9px;font:inherit;font-size:13px;margin:6px 0}
.rv-qlist button{display:block;width:100%;text-align:left;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px;cursor:pointer}
.rv-qlist button.on{border-color:#0f766e;background:#f0fdfa}.rv-qlist button.done{opacity:.6}
.rv-bar{height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;flex:1;margin:0 12px}.rv-bar i{display:block;height:100%;background:#0f766e}
.rv-radio{display:flex;gap:10px;margin:10px 0;flex-wrap:wrap}.rv-radio label{border:1px solid #cbd5e1;border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer}.rv-radio label.on{border-color:#0f766e;background:#f0fdfa}
.rv-foot{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;font-size:12px;color:#64748b;margin-top:12px}
@media(max-width:820px){.rv-two,.rv-sigs{grid-template-columns:1fr}.rv-page{padding:16px}}
`;

/* ------------------------------ shell pieces ------------------------------ */
const TAB_ORDER: { label: string; role: Role }[] = [
  { label: 'Auditor', role: 'Auditor' }, { label: 'QC', role: 'QC Reviewer' }, { label: 'Governance', role: 'Operations Governance' }, { label: 'Management', role: 'Management' },
];
export function TopBar({ session, personas, onSwitch, onSignOut, onReset, canReset, initialsOf }: { session: Persona; personas: Persona[]; onSwitch: (p: Persona) => void; onSignOut: () => void; onReset: () => void; canReset: boolean; initialsOf: (n: string) => string }) {
  return <>
    <style>{ROLE_CSS}</style>
    <div className="rv-top">
      <div className="rv-brand"><div className="mark">AI</div><div><b>AI Audit Intelligence Platform</b><span>AMS · SAP Change Request Audit</span></div></div>
      <div className="rv-tabs" role="tablist">{TAB_ORDER.map(t => <button key={t.role} className={session.role === t.role ? 'on' : ''} onClick={() => { const p = personas.find(x => x.role === t.role); if (p) onSwitch(p); }}>{t.label}</button>)}</div>
      <div className="rv-user"><div className="av">{initialsOf(session.name)}</div><div><b>{session.name}</b><small>{session.role}</small></div>
        {canReset ? <button onClick={onReset}>Reset demo data</button> : null}<button onClick={onSignOut}>Sign out</button></div>
    </div>
    <div className="rv-demo">Demo note: the four tabs above let you flip between role views for this review. A real deployment routes each person to their own view at login — nobody sees the others’ tabs.</div>
  </>;
}
export function SubNav({ pages, page, go }: { pages: string[]; page: string; go: (p: never) => void }) {
  return <div className="rv-sub">{pages.map(p => <button key={p} className={page === p ? 'on' : ''} onClick={() => go(p as never)}>{p}</button>)}</div>;
}
export const Stat = ({ label, value, note, color }: { label: string; value: ReactNode; note?: string; color?: string }) =>
  <div className="rv-card rv-stat" style={{ marginBottom: 0 }}><small>{label}</small><b style={{ color }}>{value}</b>{note ? <span>{note}</span> : null}</div>;
const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => <span className={`rv-pill ${tone}`}>{children}</span>;
const ResultPill = ({ i }: { i: { result: string; evidenceStatus: string } }) =>
  i.result === 'JUDGEMENT' ? <Pill tone="grey">Human judgement pending</Pill>
  : i.result === 'NOT_ASSESSED' ? <Pill tone="amber">{i.evidenceStatus === 'NOT_SUPPLIED' ? 'Not supplied' : 'Supplied · not validated'}</Pill>
  : <Pill tone={i.result === 'PASS' ? 'green' : i.result === 'NOT_APPLICABLE' ? 'grey' : 'red'}>{i.result.replace('_', ' ')}</Pill>;
const statusPill = (t: TV, d: AuditDecision | undefined) => {
  if (!d || d.status === 'Pending Review') return isHighRisk(t) ? <Pill tone="red">High risk</Pill> : <Pill tone="amber">Pending</Pill>;
  if (d.kind === 'Confirmed') return <Pill tone="green">Reviewed</Pill>;
  if (d.kind === 'Overridden') return <Pill tone="ind">Overridden</Pill>;
  return <Pill tone="ind">Escalated · QC</Pill>;
};

/* ------------------------------ Auditor: queue ------------------------------ */
const FILTER_ALIAS: Record<string, string> = { All: 'All', 'High+Critical': 'High + critical risk', 'SLA Breach': 'SLA breach', Pending: 'Needs my review' };
export function AuditorQueue({ tickets, decisions, initialFilter, open, go }: { tickets: TV[]; decisions: Decisions; initialFilter: string; open: (t: TV, mode: 'read' | 'decision') => void; go: (p: string) => void }) {
  const [filter, setFilter] = useState(FILTER_ALIAS[initialFilter] ?? 'All');
  const pending = (t: TV) => !decisions[t.raw.ticketId] || decisions[t.raw.ticketId].status === 'Pending Review';
  const tests: Record<string, (t: TV) => boolean> = {
    All: () => true, 'Needs my review': pending, 'Behavioural signal': t => behaviourOf(t).flagged,
    'High + critical risk': isHighRisk, 'SLA breach': t => /breach/i.test(t.raw.slaStatus), Reviewed: t => !pending(t),
  };
  const chips = ['All', 'Needs my review', 'Behavioural signal', 'High + critical risk', 'Reviewed', ...(filter === 'SLA breach' ? ['SLA breach'] : [])];
  const rows = tickets.filter(tests[filter] ?? tests.All);
  return <div className="rv-page">
    <div className="rv-head"><div><h1>My Ticket Queue</h1><p className="rv-sub-t">All tickets in the imported batch. Both the rule-based checklist result and the behavioural signal are shown side by side for every ticket.</p></div>
      <button className="rv-btn" onClick={() => go('Ticket Upload')}>Import another batch</button></div>
    <div className="rv-filters">{chips.map(c => <button key={c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>{c} ({tickets.filter(tests[c]).length})</button>)}</div>
    <div className="rv-card" style={{ padding: 8 }}>
      <table className="rv-tbl"><thead><tr><th>TICKET</th><th>TYPE</th><th>CHECKLIST</th><th>BEHAVIOUR</th><th>STATUS</th><th /></tr></thead>
        <tbody>{rows.length ? rows.map(t => { const c = checklistOf(t); const b = behaviourOf(t); const d = decisions[t.raw.ticketId];
          return <tr key={t.raw.ticketId}><td><span className="rv-id">{t.raw.ticketId}</span></td><td>{t.raw.ticketType} · {t.raw.title}</td>
            <td><Pill tone={c.fails.length ? 'red' : c.notAssessed.length ? 'amber' : 'green'}>{c.label}</Pill></td><td>{b.flagged ? <Pill tone="ind">Flagged</Pill> : '—'}</td><td>{statusPill(t, d)}</td>
            <td><button className="rv-link" onClick={() => open(t, pending(t) ? 'decision' : 'read')}>Open →</button></td></tr>; }) : <tr><td colSpan={6}>No tickets match this filter.</td></tr>}</tbody></table>
    </div>
    <div className="rv-foot">Checklist and Behaviour are separate signals by design — a ticket can pass every rule and still be flagged for the auditor’s judgement.</div>
  </div>;
}

/* ------------------------------ Ticket detail ------------------------------ */
export type Explainers = { evidence: (t: TV, f: string) => string; criterion: (f: string) => string; recommendation: (f: string, r: string[]) => string };
export function TicketDetailV2({ ticket, from, go, record, trail, workflowRecord, rules, canDecide, save, today, explain, overrideReasons }: {
  ticket: TV; from: string; go: (p: string) => void; record: AuditDecision; trail: AuditTrailEntry[]; workflowRecord?: Workflow[string]; rules?: GovernanceRules; canDecide: boolean;
  save: (d: AuditDecision) => void; today: () => string; explain: Explainers; overrideReasons: string[];
}) {
  const c = checklistOf(ticket); const b = behaviourOf(ticket); const done = record.status !== 'Pending Review';
  const [rationale, setRationale] = useState(''); const [mode, setMode] = useState<'' | 'override'>('');
  const [reason, setReason] = useState('');
  const [humanFinding, setHumanFinding] = useState<'' | 'Compliant' | 'Non-compliant'>('');
  const [overrideFinding, setOverrideFinding] = useState<'' | 'Compliant' | 'Non-compliant'>('');
  const [evidenceRef, setEvidenceRef] = useState(''); const [evidenceReviewed, setEvidenceReviewed] = useState(false);
  const sources = evidenceSources(ticket.raw);
  const hasRationale = Boolean(rationale.trim());
  const canConfirm = Boolean(humanFinding) && hasRationale && (!c.notAssessed.length || c.fails.length > 0) && (c.fails.length > 0 || humanFinding === 'Compliant');
  const canOverride = Boolean(humanFinding && overrideFinding && reason && hasRationale && evidenceRef && evidenceReviewed);
  const confirmResult: 'Compliant' | 'Non-compliant' = c.fails.length ? 'Non-compliant' : 'Compliant';
  const base = { ticketId: ticket.raw.ticketId, decisionDate: today(), version: 1, ruleVersion: 1 };
  const behFindings = ticket.assessment.findings.filter(f => /anomal|repeated handoffs/i.test(f));
  const controlFindings = c.items.filter(i => i.result === 'FAIL' || i.result === 'NOT_ASSESSED').map(i => {
    const key = i.weightKey as keyof GovernanceRules | undefined; const pen = key && rules ? rules[key] : undefined;
    return {
      key: i.id,
      title: i.result === 'FAIL' ? `${i.label}: FAIL (recorded control exception${pen !== undefined ? `; provisional penalty ${pen}` : ''}).` : `${i.label}: ${i.evidenceStatus === 'NOT_SUPPLIED' ? 'evidence not supplied' : 'evidence supplied but not validated'}.`,
      evidence: i.evidence.replace(/\n/g, ' · '), criterion: `${i.id} · Tier ${i.tier} · ${i.evidenceRequirement}`,
      recommendation: `Review ${i.label.toLowerCase()} against the linked source; request missing or unvalidated evidence.`,
    };
  });
  const signal = c.state === 'FAIL' ? { cls: 'bad', text: 'FAIL', colour: '#b91c1c' } : c.state === 'NOT_ASSESSED' ? { cls: 'none', text: 'INSUFFICIENT EVIDENCE', colour: '#0f766e' } : { cls: 'ok', text: 'CHECKS PASSED · TIER C PENDING', colour: '#0f766e' };
  const history = workflowRecord?.history ?? [];
  return <div className="rv-page">
    <button className="rv-link" onClick={() => go(from)}>← Back to {from}</button>
    <div className="rv-head" style={{ margin: '10px 0 16px' }}><h1 style={{ fontSize: 22 }}>{ticket.raw.ticketId} · {ticket.raw.title}</h1>{statusPill(ticket, record)}</div>
    <div className="rv-two">
      <div>
        <div className="rv-card"><h2>Source ticket</h2>
          <div className="rv-kv"><div><span>Type</span><b>{ticket.raw.ticketType}</b></div><div><span>Priority</span><b>{ticket.raw.priority}</b></div>
            <div><span>Created</span><b>{new Date(ticket.raw.createdDate).toLocaleDateString('en-GB')}</b></div><div><span>Resolved</span><b>{new Date(ticket.raw.resolutionDate).toLocaleDateString('en-GB')}</b></div>
            <div><span>SLA</span><b style={{ color: classifySla(ticket.raw.slaStatus) === 'FAIL' ? '#b91c1c' : classifySla(ticket.raw.slaStatus) === 'PASS' ? '#047857' : '#64748b' }}>{ticket.raw.slaStatus}</b></div>
            <div><span>Approval</span><b style={{ color: classifyApproval(ticket.raw.approvalStatus) === 'FAIL' ? '#b91c1c' : classifyApproval(ticket.raw.approvalStatus) === 'PASS' ? '#047857' : '#64748b' }}>{ticket.raw.approvalStatus}</b></div></div>
          <h3>Issue description</h3><p>{ticket.raw.description}</p><h3>Resolution notes</h3><p>“{ticket.raw.resolutionNotes}”</p></div>
        <div className="rv-card"><h2>Case lifecycle &amp; traceability</h2>
          <p>Current stage: <b>{stageOf(record, workflowRecord)}</b> · Auditor decision version {record.version ?? 'pending'} · Applied rule version {record.ruleVersion ?? 'pending'}.</p>
          {history.length ? <details><summary>QC / Governance / Management review history ({history.length})</summary>{history.map((entry, index) => <p key={index} style={{ fontSize: 12, marginTop: 7 }}>{entry}</p>)}</details> : <p>Independent QC and governance outcomes will appear here after they are recorded.</p>}
          <p>No corrective action has been linked to this case.</p></div>
        <div className="rv-card"><h2>Decision authority</h2><p>Automated assessment: <b>Recommendation only</b> — human auditor approval required for every ticket.</p></div>
      </div>
      <div>
        <div className="rv-sigs">
          <div className={`rv-sig ${signal.cls}`}><small>Automated checklist status</small><b style={{ fontSize: 17, color: signal.colour }}>{signal.text}</b>
            <span style={{ fontSize: 12 }}>{`${c.items.filter(i => i.result === 'PASS').length} automated PASS · ${c.fails.length} FAIL · ${c.gaps.length} evidence gaps`}. Final determination requires human review.</span></div>
          <div className={`rv-sig ${b.flagged ? 'beh' : 'none'}`}><small>Behavioural analysis</small><b style={{ color: b.flagged ? '#4338ca' : '#64748b', fontSize: 20 }}>{b.flagged ? 'Flagged for review' : 'No review cue triggered'}</b>
            <span style={{ fontSize: 12 }}>{b.flagged ? 'Behavioural review cue; examine the original activity history' : 'Available evidence did not trigger a cue'}</span></div>
        </div>
        <div className="rv-card"><h2>Checklist items</h2><p style={{ fontSize: 12 }}>Applicable controls for this ticket type. Human judgement remains separate from automated findings.</p>
          {c.items.map(i => <div className="rv-chk" key={i.id} title={i.evidence}><span className="tier">Tier {i.tier}</span><span className="lbl">{i.label}</span><ResultPill i={i} /></div>)}
          <details style={{ marginTop: 10, fontSize: 12 }}><summary>View source evidence mapped to each control</summary>
            {c.items.map(i => <p key={i.id} style={{ marginTop: 8 }}><b>{i.label}</b>: {i.evidence.replace(/\n/g, ' · ')}</p>)}</details></div>
        <div className="rv-card" style={{ borderColor: '#c7d2fe' }}><h2 style={{ color: '#4338ca' }}>Why was this flagged?</h2>
          {controlFindings.map(f => <div key={f.key} style={{ borderTop: '1px solid #f1f5f9', padding: '10px 0' }}>
            <b style={{ fontSize: 13 }}>{f.title}</b>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}><b>Evidence:</b> {f.evidence}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12 }}><b>Criterion:</b> {f.criterion}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12 }}><b>Recommendation:</b> {f.recommendation}</p></div>)}
          {behFindings.map(f => <div key={f} style={{ borderTop: '1px solid #f1f5f9', padding: '10px 0' }}>
            <b style={{ fontSize: 13 }}>{f}</b>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}><b>Evidence:</b> {explain.evidence(ticket, f)}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12 }}><b>Criterion:</b> {explain.criterion(f)}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12 }}><b>Recommendation:</b> {explain.recommendation(f, ticket.assessment.recommendations)}</p></div>)}
          {behFindings.length ? <p style={{ fontSize: 11, marginTop: 8 }}>A behavioural flag requires review of the activity history; it does not establish a control failure.</p> : null}
          {controlFindings.length === 0 && behFindings.length === 0 ? <p>No material control exceptions found.</p> : null}
          <p style={{ fontSize: 11, marginTop: 8 }}>Evidence Coverage Index: {c.coverage}% of applicable automated controls have validated evidence outcomes; Tier C is excluded and still needs human judgement. This is not a prediction of accuracy.</p></div>
        <div className="rv-card"><h2>Auditor decision</h2>
          {done ? <p>Decision v{record.version ?? 1} · Rule v{record.ruleVersion ?? 1}: <b>{record.finalFinding ?? auditorLabel(record)}</b>{record.rationale ? <> — “{record.rationale}”</> : null}. A QC return creates a new review version; prior records remain inspectable.</p> :
            canDecide ? <>
              <p><b>Tier C · Human assessment (required to conclude the review)</b></p>
              <select aria-label="Tier C judgement" className="rv-sel" value={humanFinding} onChange={e => setHumanFinding(e.target.value as '' | 'Compliant' | 'Non-compliant')}>
                <option value="">Select human judgement</option><option value="Compliant">Satisfactory based on reviewed evidence</option><option value="Non-compliant">Quality / effectiveness concern</option></select>
              <textarea aria-label="Auditor rationale" className="rv-ta" rows={3} placeholder="Short rationale — no minimum length (e.g. Reviewed or ok)" value={rationale} onChange={e => setRationale(e.target.value)} />
              {c.state === 'NOT_ASSESSED' ? <div className="rv-warn">Incomplete evidence: an automatic compliant confirmation is blocked. Escalate or record a justified override with an evidence reference.</div> : null}
              {mode === 'override' ? <>
                <select className="rv-sel" aria-label="Final override disposition" value={overrideFinding} onChange={e => setOverrideFinding(e.target.value as '' | 'Compliant' | 'Non-compliant')}><option value="">Select final disposition</option><option>Compliant</option><option>Non-compliant</option></select>
                <select className="rv-sel" aria-label="Evidence reference" value={evidenceRef} onChange={e => setEvidenceRef(e.target.value)}><option value="">Select supporting source</option>{sources.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                <label><input type="checkbox" aria-label="I reviewed the override evidence" checked={evidenceReviewed} onChange={e => setEvidenceReviewed(e.target.checked)} /> I reviewed this source to support my human judgement.</label>
                <select className="rv-sel" aria-label="Auditor Override Reason" value={reason} onChange={e => setReason(e.target.value)}><option value="">Select an override reason</option>{overrideReasons.map(r => <option key={r}>{r}</option>)}</select></> : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="rv-btn pri" disabled={!canConfirm} onClick={() => save({ ...base, status: 'Reviewed', kind: 'Confirmed', finalFinding: confirmResult, humanFinding: humanFinding || undefined, rationale: rationale.trim() })}>Confirm AI result</button>
                {mode === 'override' ? <button className="rv-btn" disabled={!canOverride} onClick={() => save({ ...base, status: 'Escalated', kind: 'Overridden', finalFinding: overrideFinding, humanFinding: humanFinding || undefined, evidenceRef, evidenceReviewed, overrideReason: reason, rationale: rationale.trim() })}>Save override</button> : <button className="rv-btn" onClick={() => setMode('override')}>Override</button>}
                <button className="rv-btn ind" disabled={!hasRationale} onClick={() => save({ ...base, status: 'Escalated', finalFinding: 'Escalate', humanFinding: humanFinding || undefined, rationale: rationale.trim() })}>Escalate to QC</button>
              </div>
              <p style={{ fontSize: 11, marginTop: 8 }}>Complete the human assessment, or escalate when evidence is insufficient. Overrides require a reason and reviewed source.</p></> :
              <p>Read-only for your role. Only the Auditor records the first decision on a ticket.</p>}
          {trail.length ? <div style={{ marginTop: 10 }}><h3>Audit trail</h3>{trail.map((e, i) => <p key={i} style={{ fontSize: 12, margin: '3px 0' }}>{e.event} · {e.occurredAt}{e.decision ? ` · ${e.decision}` : ''}{e.rationale ? ` — ${e.rationale}` : ''}</p>)}</div> : null}
        </div>
      </div>
    </div>
  </div>;
}

/* ------------------------------ QC: blind-then-reveal ------------------------------ */
export function QCQueue({ tickets, decisions, workflow, onBlind, onAct, open }: {
  tickets: TV[]; decisions: Decisions; workflow: Workflow; onBlind: (id: string, view: BlindView) => void; onAct: Act; open: (t: TV) => void;
}) {
  const rows = tickets.filter(t => decisions[t.raw.ticketId] && decisions[t.raw.ticketId].status !== 'Pending Review');
  const info = (t: TV) => { const rec = workflow[t.raw.ticketId]; const st = stageOf(decisions[t.raw.ticketId], rec); return { rec, st, step: st === 'Awaiting QC' ? (rec?.qcBlind ? 2 : 1) : 0 }; };
  const [sel, setSel] = useState<string>(''); const [comment, setComment] = useState(''); const [choice, setChoice] = useState<BlindView | ''>('');
  const current = rows.find(t => t.raw.ticketId === sel) ?? rows.find(t => info(t).step > 0) ?? rows[0];
  const step1 = rows.filter(t => info(t).step === 1).length; const step2 = rows.filter(t => info(t).step === 2).length;
  const endorsed = rows.filter(t => workflow[t.raw.ticketId]?.qc?.outcome === 'Agreed').length;
  const sentBack = Object.values(workflow).reduce((n, r) => n + r.history.filter(h => h.startsWith('QC · Returned')).length, 0);
  const c = current ? checklistOf(current) : null; const i = current ? info(current) : null;
  const stance = current ? auditorStance(current, decisions[current.raw.ticketId]) : null; const blind = current ? workflow[current.raw.ticketId]?.qcBlind : undefined;
  return <div className="rv-page">
    <h1>QC Review Queue</h1>
    <p className="rv-sub-t">Every audited ticket reaches QC. Step 1: form your own view blind, from the checklist and source evidence only. Step 2: compare against the Auditor’s result and sign off. This sequencing protects independent judgement.</p>
    <div className="rv-grid4">
      <Stat label="Awaiting your assessment" value={step1} color="#b45309" note="Step 1 · blind" /><Stat label="Ready to compare" value={step2} color="#4338ca" note="Step 2 · revealed" />
      <Stat label="Endorsed" value={endorsed} color="#047857" /><Stat label="Sent back" value={sentBack} color="#b91c1c" /></div>
    {rows.length === 0 ? <div className="rv-card">No audited tickets yet. The Auditor must record decisions first.</div> :
      <div className="rv-two" style={{ gridTemplateColumns: 'minmax(260px,1fr) minmax(0,2fr)' }}>
        <div className="rv-qlist">{rows.map(t => { const x = info(t); return <button key={t.raw.ticketId} className={`${current?.raw.ticketId === t.raw.ticketId ? 'on' : ''} ${x.step === 0 ? 'done' : ''}`} onClick={() => { setSel(t.raw.ticketId); setComment(''); setChoice(''); }}>
          <div className="rv-row" style={{ padding: 0, border: 0 }}><span className="rv-id">{t.raw.ticketId}</span>{x.step === 1 ? <Pill tone="amber">Step 1 · Blind</Pill> : x.step === 2 ? <Pill tone="ind">Step 2 · Compare</Pill> : <Pill tone="green">{x.st.replace('Final - ', '')}</Pill>}</div>
          <small style={{ color: '#64748b' }}>{t.raw.ticketType} · {t.raw.title}</small></button>; })}</div>
        {current && c && i ? <div className="rv-card">
          <div className="rv-row" style={{ border: 0, padding: 0 }}><h2>{current.raw.ticketId} · {current.raw.title}</h2>{i.step !== 1 ? <button className="rv-link" onClick={() => open(current)}>View full ticket →</button> : null}</div>
          {i.step === 1 ? <>
            <p>Step 1 of 2 — only the checklist and source evidence are shown. No AI output and no Auditor decision yet.</p>
            <div className="rv-kv"><div><span>SLA</span><b>{current.raw.slaStatus}</b></div><div><span>Approval</span><b>{current.raw.approvalStatus}</b></div></div>
            <h3>Resolution notes</h3><p>“{current.raw.resolutionNotes}”</p>
            <h3>Checklist items</h3>{c.items.map(x => <div className="rv-chk" key={x.label}><span className="tier">Tier {x.tier}</span><span className="lbl">{x.label}</span><ResultPill i={x} /></div>)}
            <div className="rv-radio">{(['Compliant', 'Non-compliant', 'Escalate'] as BlindView[]).map(v => <label key={v} className={choice === v ? 'on' : ''}><input type="radio" name="blind" checked={choice === v} onChange={() => setChoice(v)} /> {v}</label>)}</div>
            <button className="rv-btn pri" disabled={!choice} onClick={() => { if (choice) { onBlind(current.raw.ticketId, choice); setChoice(''); } }}>Submit &amp; reveal Auditor’s result</button></> :
          <>
            {blind ? <div className="rv-note" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}><small style={{ color: '#64748b' }}>YOUR INDEPENDENT ASSESSMENT · RECORDED BEFORE REVEAL</small><br /><b>{blind.view}</b><br /><small>Submitted {blind.at} by {blind.by}, from the checklist and source evidence only.</small></div> : null}
            <div className="rv-note"><small style={{ color: '#4338ca' }}>{i.step === 2 ? 'NOW REVEALED — ' : ''}AUDITOR’S RESULT</small><br /><b>{auditorLabel(decisions[current.raw.ticketId])}</b>{decisions[current.raw.ticketId].rationale ? <><br />Rationale: “{decisions[current.raw.ticketId].rationale}”</> : null}</div>
            {blind && stance && blind.view !== stance ? <div className="rv-warn" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}><b>Disagreement</b> — your blind read was “{blind.view}”; the Auditor’s decision amounts to “{stance}”. Worth a closer look before sign-off.</div> : blind ? <div className="rv-warn" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#047857' }}>Your blind read matches the Auditor’s result.</div> : null}
            {i.step === 2 ? <><textarea className="rv-ta" rows={2} placeholder="QC comment (required to send back)…" value={comment} onChange={e => setComment(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}><button className="rv-btn pri" onClick={() => { onAct(current.raw.ticketId, 'qc', 'Agreed', comment.trim()); setComment(''); }}>Endorse Auditor’s call</button>
                <button className="rv-btn red" disabled={!comment.trim()} onClick={() => { onAct(current.raw.ticketId, 'qc', 'Returned', comment.trim()); setComment(''); }}>Send back for re-review</button></div></> : <p>Status: {i.st}.</p>}</>}
        </div> : null}
      </div>}
    <div className="rv-foot">QC step is a prototype of the target design. Who performs QC (dedicated reviewer vs. senior auditor rotation) is a deployment decision.</div>
  </div>;
}

/* ------------------------------ Governance investigations ------------------------------ */
export const ROOT_CAUSES = ['Evidence not sufficient', 'Audit rule unclear', 'Rule too strict / too lenient', 'Auditor applied rule inconsistently', 'Source data quality'] as const;
export type RootCause = typeof ROOT_CAUSES[number];
export const CONTROLS = ['Approval evidence', 'SLA compliance', 'Documentation completeness', 'Resolution quality', 'Behavioural signal'] as const;
export const ACTIONS = ['Improve evidence capture (make the field mandatory / add to ticket form)', 'Clarify rule wording or checklist guidance', 'Adjust rule weight or threshold', 'Auditor guidance / calibration session', 'Fix data export or field mapping', 'No system change needed'] as const;
export const RELATED_SETTINGS: Record<string, string> = { 'Approval evidence': 'Missing approval weight', 'SLA compliance': 'SLA penalty weight', 'Documentation completeness': 'Documentation quality weight · Documentation minimum length', 'Resolution quality': 'Poor / Fair resolution quality weight', 'Behavioural signal': 'Isolation Forest sensitivity (model setting, not a rule weight)' };
export type Investigation = { ticketId: string; cause: RootCause; control: string; action: string; note: string; by: string; at: string; status: 'Open' | 'Actioned' };

export function disputedCases(tickets: TV[], decisions: Decisions, workflow: Workflow) {
  return tickets.flatMap(t => {
    const d = decisions[t.raw.ticketId]; if (!d || d.status === 'Pending Review') return [];
    const rec = workflow[t.raw.ticketId]; const reasons: string[] = [];
    if (d.kind === 'Overridden') reasons.push(`Auditor overrode the AI (“${d.overrideReason ?? 'no reason'}”)`);
    if (!d.kind) reasons.push('Auditor escalated to QC');
    if (rec?.history.some(h => h.startsWith('QC · Returned'))) reasons.push('QC sent the decision back');
    const stance = auditorStance(t, d);
    if (rec?.qcBlind && stance && rec.qcBlind.view !== stance) reasons.push(`QC’s blind read (${rec.qcBlind.view}) differs from the Auditor (${stance})`);
    if (rec?.gov?.outcome === 'Escalated') reasons.push('Governance escalated to Management');
    return reasons.length ? [{ t, d, rec, reasons, stance }] : [];
  });
}
function evidenceLeads(t: TV) {
  const out: string[] = []; const notes = t.raw.resolutionNotes.trim();
  if (notes.length < 20 || /^(n\/?a|none|fixed|done|completed|incomplete|unknown|not provided)\.?$/i.test(notes)) out.push(`Resolution notes are thin (“${notes || 'empty'}”) — the auditor may have had little to judge from.`);
  if (/missing|not tracked|not provided/i.test(t.raw.approvalStatus)) out.push(`Approval status reads “${t.raw.approvalStatus}” — the evidence may simply not have been recorded.`);
  if (/not tracked|not provided/i.test(t.raw.description) || t.raw.description.trim().length < 15) out.push('The issue description is missing or generic.');
  return out;
}
function ruleLeads(c: { d: AuditDecision; stance: BlindView | null; rec?: { qcBlind?: { view: BlindView } } }, sameCount: number) {
  const out: string[] = [];
  if (c.d.overrideReason === 'Incorrect classification') out.push('Auditor overrode as “Incorrect classification” — the rule may not fit this type of case.');
  if (c.d.overrideReason === 'Additional context available') out.push('Auditor used context the rule cannot see — consider whether the rule should capture it.');
  if (c.rec?.qcBlind && c.stance && c.rec.qcBlind.view !== c.stance) out.push('QC and the Auditor read the same evidence differently — a sign the rule wording leaves room for interpretation.');
  if (sameCount >= 2) out.push(`${sameCount} disputed tickets involve the same control — a pattern, not a one-off.`);
  return out;
}
const primaryControl = (t: TV) => { const c = checklistOf(t); const f = c.fails[0]; return f ? (f.area === 'approval' ? 'Approval evidence' : f.area === 'SLA' ? 'SLA compliance' : 'Documentation completeness') : behaviourOf(t).flagged ? 'Behavioural signal' : 'Resolution quality'; };

function InvestigationCard({ item, existing, sameCount, reviewer, onSave, escalated, onEscalate }: { item: ReturnType<typeof disputedCases>[number]; existing?: Investigation; sameCount: number; reviewer: string; onSave: (i: Investigation) => void; escalated: boolean; onEscalate: (note: string) => void }) {
  const t = item.t; const [open, setOpen] = useState(false);
  const [cause, setCause] = useState<RootCause | ''>(existing?.cause ?? ''); const [control, setControl] = useState<string>(existing?.control ?? primaryControl(t));
  const [action, setAction] = useState(existing?.action ?? ''); const [note, setNote] = useState(existing?.note ?? '');
  const ev = evidenceLeads(t); const ru = ruleLeads(item, sameCount); const valid = cause && action && note.trim();
  const save = (status: 'Open' | 'Actioned') => { if (cause) onSave({ ticketId: t.raw.ticketId, cause, control, action, note: note.trim(), by: reviewer, at: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), status }); };
  return <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 0' }}>
    <div className="rv-row" style={{ border: 0, padding: 0 }}><span><span className="rv-id">{t.raw.ticketId}</span> <small style={{ color: '#64748b' }}>{t.raw.title}</small></span>
      {escalated ? <Pill tone="amber">Escalated to Management</Pill> : null}{existing ? <Pill tone={existing.status === 'Actioned' ? 'green' : 'amber'}>{existing.status === 'Actioned' ? 'Actioned' : 'Investigated · action open'}</Pill> : <Pill tone="red">Needs investigation</Pill>}</div>
    <ul style={{ margin: '6px 0', paddingLeft: 18, fontSize: 12, color: '#475569' }}>{item.reasons.map(r => <li key={r}>{r}</li>)}</ul>
    {existing && !open ? <p style={{ fontSize: 12 }}><b>{existing.cause}</b> · {existing.control} → {existing.action}<br />“{existing.note}” — {existing.by}, {existing.at}</p> : null}
    {!open ? <button className="rv-btn" onClick={() => setOpen(true)}>{existing ? 'Edit investigation' : 'Investigate'}</button> : <div className="rv-note" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
      <h3>Leads to check — not conclusions</h3>
      <p style={{ fontSize: 12, margin: '2px 0' }}><b>Evidence not enough?</b></p>{ev.length ? <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12 }}>{ev.map(x => <li key={x}>{x}</li>)}</ul> : <p style={{ fontSize: 12 }}>No obvious gaps in the source fields.</p>}
      <p style={{ fontSize: 12, margin: '2px 0' }}><b>Rule unclear?</b></p>{ru.length ? <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12 }}>{ru.map(x => <li key={x}>{x}</li>)}</ul> : <p style={{ fontSize: 12 }}>No signs of disagreement about how to read the rule.</p>}
      <label style={{ fontSize: 12, fontWeight: 600 }}>Root cause (your judgement)</label>
      <select className="rv-sel" value={cause} onChange={e => setCause(e.target.value as RootCause)}><option value="">Select a root cause</option>{ROOT_CAUSES.map(r => <option key={r}>{r}</option>)}</select>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Control affected</label>
      <select className="rv-sel" value={control} onChange={e => setControl(e.target.value)}>{CONTROLS.map(r => <option key={r}>{r}</option>)}</select>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Improvement action</label>
      <select className="rv-sel" value={action} onChange={e => setAction(e.target.value)}><option value="">Select an action</option>{ACTIONS.map(r => <option key={r}>{r}</option>)}</select>
      {action.startsWith('Adjust rule') || action.startsWith('Clarify') ? <div className="rv-warn">Related setting: <b>{RELATED_SETTINGS[control]}</b>. Change it in “Governance configuration” below, then mark this investigation as actioned.</div> : null}
      <textarea className="rv-ta" rows={2} placeholder="Findings and reasoning (required)…" value={note} onChange={e => setNote(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="rv-btn pri" disabled={!valid} onClick={() => { save('Open'); setOpen(false); }}>Save investigation</button>
        <button className="rv-btn" disabled={!valid} onClick={() => { save('Actioned'); setOpen(false); }}>Save and mark as actioned</button>
        {action.startsWith('Adjust rule') || action.startsWith('Clarify') ? <button className="rv-btn ind" onClick={() => document.getElementById('gov-config')?.scrollIntoView({ behavior: 'smooth' })}>Go to rule configuration ↓</button> : null}
        {escalated ? null : <button className="rv-btn" disabled={!valid} title="Fill in root cause, action and findings first" onClick={() => { save('Open'); onEscalate(`${cause} — ${note.trim()}`); setOpen(false); }}>Save and escalate to Management</button>}
        <button className="rv-btn" onClick={() => setOpen(false)}>Cancel</button></div></div>}
  </div>;
}

/* ------------------------------ Governance workspace ------------------------------ */
export function GovernanceWorkspace({ tickets, decisions, workflow, onAct, open, investigations, onInvestigate, reviewer, children }: { tickets: TV[]; decisions: Decisions; workflow: Workflow; onAct: Act; open: (t: TV) => void; investigations: Record<string, Investigation>; onInvestigate: (i: Investigation) => void; reviewer: string; children: ReactNode }) {
  const [comments, setComments] = useState<Record<string, string>>({});
  const stage = (t: TV) => stageOf(decisions[t.raw.ticketId], workflow[t.raw.ticketId]);
  const awaiting = tickets.filter(t => stage(t) === 'Awaiting Governance');
  const decided = tickets.filter(t => decisions[t.raw.ticketId] && decisions[t.raw.ticketId].status !== 'Pending Review');
  const cases = disputedCases(tickets, decisions, workflow);
  const controlCount = (c: string) => cases.filter(x => primaryControl(x.t) === c).length;
  const endorsed = tickets.filter(t => workflow[t.raw.ticketId]?.qc?.outcome === 'Agreed').length;
  const sentBack = Object.values(workflow).reduce((n, r) => n + r.history.filter(h => h.startsWith('QC · Returned')).length, 0);
  const confirmedNon = tickets.filter(t => workflow[t.raw.ticketId]?.gov?.outcome === 'Approved' && checklistOf(t).fails.length > 0).length;
  const recurring = useMemo(() => [
    { label: 'Missing approval evidence', n: tickets.filter(t => failsIn(t, 'approval')).length },
    { label: 'SLA breach', n: tickets.filter(t => failsIn(t, 'SLA')).length },
    { label: 'Documentation incomplete', n: tickets.filter(t => failsIn(t, 'docs')).length },
    { label: 'Behavioural signal', n: tickets.filter(t => behaviourOf(t).flagged).length }], [tickets]);
  const maxN = Math.max(1, ...recurring.map(r => r.n));
  const ledger = [
    { name: 'Tier A · Approval evidence check', has: (t: TV) => failsIn(t, 'approval') },
    { name: 'Tier B · Documentation completeness', has: (t: TV) => failsIn(t, 'docs') },
    { name: 'Behavioural · Anomaly signal', has: (t: TV) => behaviourOf(t).flagged }].map(l => {
    const flagged = decided.filter(l.has); const confirmed = flagged.filter(t => decisions[t.raw.ticketId].kind === 'Confirmed').length;
    return { ...l, tested: decided.length, trust: decided.length < 30 ? 'Insufficient Evidence' : flagged.length ? `${Math.round(100 * confirmed / flagged.length)}% auditor-confirmed` : 'No flags to assess' };
  });
  const cm = (id: string) => (comments[id] ?? '').trim();
  return <div className="rv-page">
    <h1>Governance Workspace</h1><p className="rv-sub-t">Rule configuration and the Auditor Consistency Intelligence panel live here — this is who should own them.</p>
    <div className="rv-grid2">
      <div className="rv-card"><h2>Final decisions queue</h2><p>QC-endorsed tickets awaiting Governance sign-off.</p>
        {awaiting.length === 0 ? <p>Nothing awaiting sign-off.</p> : awaiting.map(t => <div key={t.raw.ticketId} style={{ borderTop: '1px solid #f1f5f9', padding: '10px 0' }}>
          <div className="rv-row" style={{ border: 0, padding: 0 }}><button className="rv-link" onClick={() => open(t)}><span className="rv-id">{t.raw.ticketId}</span></button><Pill tone="amber">Awaiting sign-off</Pill></div>
          <small style={{ color: '#64748b' }}>{auditorLabel(decisions[t.raw.ticketId])} · QC-endorsed</small>
          <textarea className="rv-ta" rows={2} placeholder="Comment (required to escalate)…" value={comments[t.raw.ticketId] ?? ''} onChange={e => setComments(c => ({ ...c, [t.raw.ticketId]: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}><button className="rv-btn pri" onClick={() => onAct(t.raw.ticketId, 'gov', 'Approved', cm(t.raw.ticketId))}>Approve (final)</button>
            <button className="rv-btn ind" disabled={!cm(t.raw.ticketId)} onClick={() => onAct(t.raw.ticketId, 'gov', 'Escalated', cm(t.raw.ticketId))}>Escalate to Management</button></div></div>)}</div>
    </div>
    <div className="rv-card"><h2>Investigate disputed cases</h2>
      <p>Where the auditor overrode or escalated, QC sent a decision back, or QC and the Auditor read a ticket differently. For each one, decide <b>why</b>: was the evidence not enough, or is the audit rule unclear? Then record the improvement.</p>
      {cases.length === 0 ? <p>No disputed cases yet.</p> : cases.map(x => <InvestigationCard key={x.t.raw.ticketId} item={x} existing={investigations[x.t.raw.ticketId]} sameCount={controlCount(primaryControl(x.t))} reviewer={reviewer} onSave={onInvestigate} escalated={/Management/.test(stage(x.t))} onEscalate={note => onAct(x.t.raw.ticketId, 'gov', 'Escalated', note)} />)}</div>
    <div className="rv-card"><h2>Improvement backlog</h2>
      <p>Built from the investigations above. This is what Governance acts on: improve evidence capture, clarify rule wording, or adjust the rule settings below.</p>
      {Object.keys(investigations).length === 0 ? <p>No investigations recorded yet.</p> : <>
        <div className="rv-grid4">{ROOT_CAUSES.map(r => <Stat key={r} label={r} value={Object.values(investigations).filter(i => i.cause === r).length} />)}</div>
        <table className="rv-tbl"><thead><tr><th>CONTROL</th><th>ROOT CAUSE</th><th>ACTION</th><th>TICKETS</th><th>STATUS</th></tr></thead><tbody>{Object.values(investigations).reduce<{ key: string; control: string; cause: string; action: string; ids: string[]; open: number }[]>((rows, i) => { const key = `${i.control}|${i.cause}|${i.action}`; const row = rows.find(r => r.key === key); if (row) { row.ids.push(i.ticketId); if (i.status === 'Open') row.open++; } else rows.push({ key, control: i.control, cause: i.cause, action: i.action, ids: [i.ticketId], open: i.status === 'Open' ? 1 : 0 }); return rows; }, []).map(r => <tr key={r.key}><td>{r.control}</td><td>{r.cause}</td><td>{r.action}</td><td>{r.ids.join(', ')}</td><td>{r.open ? <Pill tone="amber">{r.open} open</Pill> : <Pill tone="green">Actioned</Pill>}</td></tr>)}</tbody></table></>}
      <div style={{ marginTop: 10 }}><button className="rv-btn ind" onClick={() => document.getElementById('gov-config')?.scrollIntoView({ behavior: 'smooth' })}>Go to rule configuration ↓</button></div></div>
    <div className="rv-card"><h2>Recurring findings</h2><p>Counted across the current ticket set — not a validated trend. A repeated pattern is what starts a review of the control.</p>
      {recurring.map(r => <div className="rv-row" key={r.label}><span style={{ minWidth: 190 }}>{r.label}</span><div className="rv-bar"><i style={{ width: `${100 * r.n / maxN}%` }} /></div><b>{r.n}</b></div>)}</div>
    <div className="rv-card"><h2>Weekly assurance summary</h2><div className="rv-grid4" style={{ marginBottom: 0 }}>
      <Stat label="Tickets audited" value={decided.length} note={`of ${tickets.length} in batch`} /><Stat label="QC-endorsed" value={endorsed} color="#047857" /><Stat label="Sent back" value={sentBack} color="#b91c1c" /><Stat label="Confirmed non-compliance" value={confirmedNon} color="#b45309" note="Governance-approved, checklist FAIL" /></div></div>
    <div className="rv-card"><h2>Assurance Trust Ledger</h2><p>For each control or signal: how many cases it has been tested on and how often the auditor confirmed it. A thin evidence base reads “Insufficient Evidence”, not a score. Prototype rule: under 30 reviewed cases is insufficient.</p>
      {ledger.map(l => <div className="rv-row" key={l.name}><span>{l.name}</span><span style={{ color: '#64748b' }}>{l.tested} cases tested</span><Pill tone={l.trust === 'Insufficient Evidence' ? 'grey' : 'teal'}>{l.trust}</Pill></div>)}</div>
    <div id="gov-config">{children}</div>
  </div>;
}

/* ------------------------------ Management overview ------------------------------ */
export function AssuranceOverview({ tickets, decisions, workflow, onAct, open }: { tickets: TV[]; decisions: Decisions; workflow: Workflow; metricsLog: MetricEvent[]; onAct: Act; open: (t: TV) => void }) {
  const [comments, setComments] = useState<Record<string, string>>({});
  const n = tickets.length;
  const avg = n ? Math.round(tickets.reduce((s, t) => s + t.assessment.complianceScore, 0) / n) : 0;
  const hc = tickets.filter(isHighRisk).length; const sla = tickets.filter(t => /breach/i.test(t.raw.slaStatus)).length; const beh = tickets.filter(t => behaviourOf(t).flagged).length;
  const esc = tickets.filter(t => stageOf(decisions[t.raw.ticketId], workflow[t.raw.ticketId]) === 'Escalated to Management');
  const pct = (a: number, b: number) => b ? `${Math.round(100 * a / b)}%` : '—';
  return <div className="rv-page">
    <h1>Assurance Overview</h1><p className="rv-sub-t">Trend and business-value view. Same underlying data as the Auditor and Governance views — no separate data model. Figures cover the currently loaded batch only.</p>
    <div className="rv-grid4"><Stat label="Avg. compliance" value={n ? `${avg}%` : '—'} /><Stat label="High + critical risk" value={n ? hc : '—'} color="#b91c1c" /><Stat label="SLA breach rate" value={pct(sla, n)} color="#b45309" /><Stat label="Behavioural flags" value={n ? beh : '—'} color="#4338ca" /></div>
    <div className="rv-card"><h2>Escalated to Management</h2>{esc.length === 0 ? <p>No escalations awaiting a Management decision.</p> : esc.map(t => <div key={t.raw.ticketId} style={{ borderTop: '1px solid #f1f5f9', padding: '10px 0' }}>
      <div className="rv-row" style={{ border: 0, padding: 0 }}><button className="rv-link" onClick={() => open(t)}><span className="rv-id">{t.raw.ticketId}</span></button><Pill tone="ind">Escalated by Governance</Pill></div>
      <small style={{ color: '#64748b' }}>{workflow[t.raw.ticketId]?.gov?.comment}</small>
      <textarea className="rv-ta" rows={2} placeholder="Comment (required to reject)…" value={comments[t.raw.ticketId] ?? ''} onChange={e => setComments(c => ({ ...c, [t.raw.ticketId]: e.target.value }))} />
      <div style={{ display: 'flex', gap: 8 }}><button className="rv-btn pri" onClick={() => onAct(t.raw.ticketId, 'mgmt', 'Accepted', (comments[t.raw.ticketId] ?? '').trim())}>Accept finding</button>
        <button className="rv-btn red" disabled={!(comments[t.raw.ticketId] ?? '').trim()} onClick={() => onAct(t.raw.ticketId, 'mgmt', 'Rejected', (comments[t.raw.ticketId] ?? '').trim())}>Reject finding</button></div></div>)}</div>
    <div className="rv-card"><h2>Compliance by ticket (current batch)</h2><p>Per-ticket scores. A week-over-week trend needs several batches over time and is not shown here.</p>
      {tickets.map(t => <div className="rv-row" key={t.raw.ticketId} style={{ padding: '6px 0' }}><span className="rv-id" style={{ minWidth: 90 }}>{t.raw.ticketId}</span><div className="rv-bar"><i style={{ width: `${t.assessment.complianceScore}%`, background: isHighRisk(t) ? '#b91c1c' : '#0f766e' }} /></div><b>{t.assessment.complianceScore}%</b></div>)}</div>
  </div>;
}
