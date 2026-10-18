import { useState } from 'react';
import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Role-based prototype access (client-side only; NOT real authentication)
 * Maps to the audit lifecycle:
 *   Auditor -> QC Reviewer -> Operations Governance -> Management (escalation)
 * ------------------------------------------------------------------ */

export type Role = 'Auditor' | 'QC Reviewer' | 'Operations Governance' | 'Management';
export type Persona = { name: string; role: Role; email: string; company: string; blurb: string };

export const COMPANY = 'ACME Distribution Sdn. Bhd.';
export const DEMO_PASSWORD = 'Demo123!';

export const PERSONAS: Persona[] = [
  { name: 'Janis Ong', role: 'Auditor', email: 'auditor@acme-demo.com', company: COMPANY, blurb: 'Imports the weekly batch, reviews AI findings, confirms or overrides' },
  { name: 'Aisha Rahman', role: 'QC Reviewer', email: 'qc@acme-demo.com', company: COMPANY, blurb: 'Checks every auditor decision before it moves on' },
  { name: 'Mei Ling Tan', role: 'Operations Governance', email: 'governance@acme-demo.com', company: COMPANY, blurb: 'Makes the final call; sets governance rules; escalates' },
  { name: 'Daniel Wong', role: 'Management', email: 'management@acme-demo.com', company: COMPANY, blurb: 'Oversight view; decides on escalated tickets' },
];

/** Which sidebar pages each role may see. 'Ticket Detail Review' is reachable from any page. */
export const ROLE_PAGES: Record<Role, string[]> = {
  'Auditor': ['Dashboard', 'Ticket Upload', 'My Ticket Queue', 'Audit Report Generator'],
  'QC Reviewer': ['Dashboard', 'QC Review Queue'],
  'Operations Governance': ['Dashboard', 'Governance Workspace', 'Pilot Metrics', 'Audit Report Generator'],
  'Management': ['Dashboard', 'Assurance Overview', 'Pilot Metrics', 'Audit Report Generator'],
};
/** Each role's own ticket-queue page (used when a shared link points at the queue). */
export const QUEUE_PAGE: Record<Role, string> = { 'Auditor': 'My Ticket Queue', 'QC Reviewer': 'QC Review Queue', 'Operations Governance': 'Governance Workspace', 'Management': 'Assurance Overview' };

export const canMakeAuditDecision = (role: Role) => role === 'Auditor';
export const canResetData = (role: Role) => role === 'Auditor' || role === 'Operations Governance';
export const initials = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();

/** Validates a session loaded from localStorage (older builds stored a different shape). */
export const asPersona = (value: unknown): Persona | null => {
  const v = value as Partial<Persona> | null;
  if (!v || typeof v !== 'object') return null;
  return PERSONAS.find(p => p.name === v.name && p.role === v.role) ?? null;
};

/* ------------------------------ Login ------------------------------ */
export function RoleLogin({ onSuccess }: { onSuccess: (persona: Persona) => void }) {
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const persona = PERSONAS.find(p => p.email === email.trim().toLowerCase());
    if (companyId.trim() === 'ACME-DEMO' && persona && password === DEMO_PASSWORD) onSuccess(persona);
    else setError('Invalid company ID, email or password.');
  };
  return (
    <main className="login-page">
      <section className="login-card" style={{ maxWidth: 520 }}>
        <div className="brand-mark"><ShieldCheck size={22} /></div>
        <span className="prototype-label">Prototype environment</span>
        <h1>AI Audit Intelligence Platform</h1>
        <p className="login-company">{COMPANY}</p>
        <p className="login-copy">Choose a role to enter the demo workspace.</p>
        <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
          {PERSONAS.map(p => (
            <button key={p.role} className="primary login-submit demo-entry" style={{ textAlign: 'left' }} onClick={() => onSuccess(p)}>
              <ShieldCheck size={16} /> Enter as {p.role}
              <small>{p.name} · {p.blurb}</small>
            </button>
          ))}
        </div>
        <p className="login-option">Or sign in with company credentials</p>
        <form onSubmit={submit}>
          <label>Company ID<input value={companyId} onChange={e => setCompanyId(e.target.value)} autoComplete="organization" required /></label>
          <label>Work Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error ? <p className="login-error">{error}</p> : null}
          <button className="secondary login-submit" type="submit"><LockKeyhole size={16} /> Sign in</button>
        </form>
        <small>Demo accounts: auditor@ / qc@ / governance@ / management@acme-demo.com · Company ID ACME-DEMO · Password {DEMO_PASSWORD}. This functional prototype stores the session in the browser only; it is not production authentication or access control.</small>
      </section>
    </main>
  );
}

/* --------------------------- Review workflow --------------------------- */
export type StepOutcome = 'Agreed' | 'Returned' | 'Approved' | 'Escalated' | 'Accepted' | 'Rejected';
export type WorkflowStep = { outcome: StepOutcome; by: string; at: string; comment?: string };
export type WorkflowRecord = { qc?: WorkflowStep; gov?: WorkflowStep; mgmt?: WorkflowStep; qcBlind?: { view: 'Compliant' | 'Non-compliant' | 'Escalate'; by: string; at: string }; history: string[] };
export type Workflow = Record<string, WorkflowRecord>;

export type QueueTicket = {
  raw: { ticketId: string; title: string; ticketType: string };
  assessment: { riskLevel: string; complianceScore: number };
};
export type QueueDecision = { status: string; kind?: string };

export type Stage = 'Awaiting auditor' | 'Awaiting QC' | 'Awaiting Governance' | 'Escalated to Management' | 'Final - Approved' | 'Final - Management accepted' | 'Final - Management rejected';

export const stageOf = (decision: QueueDecision | undefined, rec: WorkflowRecord | undefined): Stage => {
  if (!decision || decision.status === 'Pending Review') return 'Awaiting auditor';
  if (rec?.gov && rec.gov.outcome !== 'Approved') { if (!rec.mgmt) return 'Escalated to Management'; return rec.mgmt.outcome === 'Accepted' ? 'Final - Management accepted' : 'Final - Management rejected'; }
  if (!rec?.qc || rec.qc.outcome !== 'Agreed') return 'Awaiting QC';
  if (!rec.gov) return 'Awaiting Governance';
  if (rec.gov.outcome === 'Approved') return 'Final - Approved';
  if (!rec.mgmt) return 'Escalated to Management';
  return rec.mgmt.outcome === 'Accepted' ? 'Final - Management accepted' : 'Final - Management rejected';
};

/** Which stage a role is responsible for acting on. */
const ACTS_ON: Record<Role, Stage | null> = {
  'Auditor': 'Awaiting auditor',
  'QC Reviewer': 'Awaiting QC',
  'Operations Governance': 'Awaiting Governance',
  'Management': 'Escalated to Management',
};

const RISK_COLOUR: Record<string, string> = { Critical: '#b42318', High: '#c4320a', Medium: '#b54708', Low: '#067647' };

export function ReviewWorkflow({ role, tickets, decisions, workflow, onAct, onOpen }: {
  role: Role;
  tickets: QueueTicket[];
  decisions: Record<string, QueueDecision>;
  workflow: Workflow;
  onAct: (ticketId: string, stage: 'qc' | 'gov' | 'mgmt', outcome: StepOutcome, comment: string) => void;
  onOpen: (ticketId: string) => void;
}) {
  const [filter, setFilter] = useState<'My queue' | 'All'>('My queue');
  const [comments, setComments] = useState<Record<string, string>>({});
  const mine = ACTS_ON[role];
  const rows = tickets.map(t => ({ t, stage: stageOf(decisions[t.raw.ticketId], workflow[t.raw.ticketId]) }));
  const visible = rows.filter(r => filter === 'All' || r.stage === mine);
  const count = (s: Stage) => rows.filter(r => r.stage === s).length;
  const comment = (id: string) => (comments[id] ?? '').trim();

  const buttons = (id: string, stage: Stage) => {
    const disabled = (needs: boolean) => needs && !comment(id);
    const go = (s: 'qc' | 'gov' | 'mgmt', o: StepOutcome) => onAct(id, s, o, comment(id));
    if (role === 'QC Reviewer' && stage === 'Awaiting QC') return <>
      <button className="primary" onClick={() => go('qc', 'Agreed')}><CheckCircle2 size={14} /> Agree</button>
      <button className="secondary" disabled={disabled(true)} title="Comment required" onClick={() => go('qc', 'Returned')}>Return to auditor</button></>;
    if (role === 'Operations Governance' && stage === 'Awaiting Governance') return <>
      <button className="primary" onClick={() => go('gov', 'Approved')}><CheckCircle2 size={14} /> Approve (final)</button>
      <button className="secondary" disabled={disabled(true)} title="Comment required" onClick={() => go('gov', 'Escalated')}>Escalate to Management</button></>;
    if (role === 'Management' && stage === 'Escalated to Management') return <>
      <button className="primary" onClick={() => go('mgmt', 'Accepted')}>Accept finding</button>
      <button className="secondary" disabled={disabled(true)} title="Comment required" onClick={() => go('mgmt', 'Rejected')}>Reject finding</button></>;
    return null;
  };

  return <>
    <div className="page-intro"><div>
      <h1>Review workflow</h1>
      <p>Auditor decision → QC review → Operations Governance final decision → Management (escalations only). Prototype: roles are enforced in this browser only.</p>
    </div></div>
    <section className="panel" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {(['Awaiting auditor', 'Awaiting QC', 'Awaiting Governance', 'Escalated to Management'] as Stage[]).map(s =>
          <div key={s}><b style={{ fontSize: 22 }}>{count(s)}</b><br /><small>{s}</small></div>)}
        <div><b style={{ fontSize: 22 }}>{rows.filter(r => r.stage.startsWith('Final')).length}</b><br /><small>Finalised</small></div>
      </div>
    </section>
    <div className="filters" style={{ marginBottom: 8 }}>
      {(['My queue', 'All'] as const).map(v => <button key={v} className={filter === v ? 'selected' : ''} onClick={() => setFilter(v)}>{v}{v === 'My queue' && mine ? ` (${count(mine)})` : ''}</button>)}
    </div>
    <section className="panel">
      {visible.length === 0 ? <p>Nothing waiting for you. {rows.length === 0 ? 'Import and analyse a ticket batch first (Auditor).' : 'Switch to “All” to see every ticket.'}</p> :
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: 8 }}>Ticket</th><th>Type</th><th>Risk</th><th>Stage</th><th>Trail / comment</th><th>Action</th></tr></thead>
          <tbody>{visible.map(({ t, stage }) => {
            const id = t.raw.ticketId; const rec = workflow[id]; const actionable = ACTS_ON[role] === stage;
            return <tr key={id} style={{ borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
              <td style={{ padding: 8 }}><a href="#t" onClick={e => { e.preventDefault(); onOpen(id); }}><b>{id}</b></a><br /><small>{t.raw.title}</small></td>
              <td>{t.raw.ticketType}</td>
              <td style={{ color: RISK_COLOUR[t.assessment.riskLevel] ?? 'inherit', fontWeight: 600 }}>{t.assessment.riskLevel}<br /><small>{t.assessment.complianceScore}/100</small></td>
              <td><b>{stage}</b></td>
              <td style={{ maxWidth: 280 }}>
                {rec?.history.length ? rec.history.map((h, i) => <div key={i}><small>{h}</small></div>) : <small>—</small>}
                {actionable && stage !== 'Awaiting auditor' ? <textarea placeholder="Comment (required to return / escalate / reject)" value={comments[id] ?? ''} onChange={e => setComments(c => ({ ...c, [id]: e.target.value }))} rows={2} style={{ width: '100%', marginTop: 6 }} /> : null}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {stage === 'Awaiting auditor' && role === 'Auditor' ? <button className="primary" onClick={() => onOpen(id)}>Review &amp; decide</button> : null}
                {actionable ? <div style={{ display: 'grid', gap: 6 }}>{buttons(id, stage)}</div> : <small>{stage === 'Awaiting auditor' && role !== 'Auditor' ? 'Auditor has not decided' : actionable ? '' : 'View only'}</small>}
              </td>
            </tr>;
          })}</tbody>
        </table>}
    </section>
  </>;
}


