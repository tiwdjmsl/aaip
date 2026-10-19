
/* Pilot metrics: measured from real clicks in this browser session.
 * Agreement rate is NOT accuracy (no ground truth); timing starts when metrics are first captured. */

export type MetricKind = 'open' | 'auditor' | 'qc' | 'gov' | 'mgmt';
export type MetricEvent = { ticketId: string; kind: MetricKind; outcome?: string; at: number; role: string };

type T = { raw: { ticketId: string; ticketType: string }; assessment: { riskLevel: string } };
type D = { status: string; kind?: string };

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const fmtDuration = (ms: number | null) => {
  if (ms === null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '—');

/** Pure calculation, exported for testing. Uses the latest event of each kind per ticket. */
export function computeMetrics(log: MetricEvent[], tickets: T[], decisions: Record<string, D>) {
  const last = (id: string, kind: MetricKind) => [...log].reverse().find(e => e.ticketId === id && e.kind === kind);
  const reviewMs: number[] = []; const toQc: number[] = []; const qcToGov: number[] = []; const govToMgmt: number[] = [];
  let qcAgreed = 0; let qcReturned = 0; let govApproved = 0; let govEscalated = 0;
  for (const t of tickets) {
    const id = t.raw.ticketId;
    const a = last(id, 'auditor'); const q = last(id, 'qc'); const g = last(id, 'gov'); const m = last(id, 'mgmt');
    if (a) {
      const opened = [...log].reverse().find(e => e.ticketId === id && e.kind === 'open' && e.at <= a.at);
      if (opened) reviewMs.push(a.at - opened.at);
    }
    if (a && q && q.at >= a.at) toQc.push(q.at - a.at);
    if (q && g && g.at >= q.at) qcToGov.push(g.at - q.at);
    if (g && m && m.at >= g.at) govToMgmt.push(m.at - g.at);
  }
  for (const e of log) {
    if (e.kind === 'qc') e.outcome === 'Agreed' ? qcAgreed++ : qcReturned++;
    if (e.kind === 'gov') e.outcome === 'Approved' ? govApproved++ : govEscalated++;
  }
  const decided = tickets.filter(t => decisions[t.raw.ticketId] && decisions[t.raw.ticketId].status !== 'Pending Review');
  const confirmed = decided.filter(t => decisions[t.raw.ticketId].kind === 'Confirmed').length;
  const overridden = decided.filter(t => decisions[t.raw.ticketId].kind === 'Overridden').length;
  const groupBy = (key: (t: T) => string) => {
    const keys = Array.from(new Set(tickets.map(key)));
    return keys.map(k => { const d = decided.filter(t => key(t) === k); const c = d.filter(t => decisions[t.raw.ticketId].kind === 'Confirmed').length; const o = d.filter(t => decisions[t.raw.ticketId].kind === 'Overridden').length; return { key: k, total: tickets.filter(t => key(t) === k).length, decided: d.length, confirmed: c, overridden: o }; });
  };
  return {
    total: tickets.length, decided: decided.length, confirmed, overridden, escalated: decided.length - confirmed - overridden,
    avgReviewMs: mean(reviewMs), reviewSamples: reviewMs.length,
    avgToQcMs: mean(toQc), avgQcToGovMs: mean(qcToGov), avgGovToMgmtMs: mean(govToMgmt),
    qcAgreed, qcReturned, govApproved, govEscalated,
    byType: groupBy(t => t.raw.ticketType), byRisk: groupBy(t => t.assessment.riskLevel),
  };
}

const card = (label: string, value: string, note?: string) => (
  <div className="panel" style={{ flex: '1 1 170px', minWidth: 170 }}>
    <small>{label}</small><div style={{ fontSize: 26, fontWeight: 700, margin: '4px 0' }}>{value}</div>{note ? <small>{note}</small> : null}
  </div>
);

export function PilotMetrics({ log, tickets, decisions }: { log: MetricEvent[]; tickets: T[]; decisions: Record<string, D> }) {
  const m = computeMetrics(log, tickets, decisions);
  const table = (title: string, rows: ReturnType<typeof computeMetrics>['byType']) => (
    <section className="panel" style={{ flex: '1 1 320px' }}>
      <h2>{title}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}><th style={{ padding: 6 }}>Group</th><th>Decided</th><th>Confirmed</th><th>Overridden</th><th>Agreement</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.key} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: 6 }}>{r.key}</td><td>{r.decided}/{r.total}</td><td>{r.confirmed}</td><td>{r.overridden}</td><td>{pct(r.confirmed, r.decided)}</td></tr>)}</tbody>
      </table>
    </section>
  );
  return <>
    <div className="page-intro"><div><h1>Pilot metrics</h1>
      <p>Measured from the reviews done in this session. Agreement rate shows how often the human auditor accepted the AI finding; it is not accuracy, which would need NTT’s own audited results as the answer key.</p></div></div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
      {card('Tickets reviewed', `${m.decided} / ${m.total}`)}
      {card('AI–auditor agreement', pct(m.confirmed, m.decided), `${m.confirmed} confirmed · ${m.overridden} overridden · ${m.escalated} escalated`)}
      {card('QC return rate', pct(m.qcReturned, m.qcAgreed + m.qcReturned), `${m.qcReturned} returned of ${m.qcAgreed + m.qcReturned} QC checks`)}
      {card('Avg review time', fmtDuration(m.avgReviewMs), m.reviewSamples ? `from ${m.reviewSamples} ticket(s): open → decision` : 'No timed reviews yet')}
    </div>
    <section className="panel" style={{ marginBottom: 12 }}>
      <h2>Hand-off waiting time</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div><b>{fmtDuration(m.avgToQcMs)}</b><br /><small>Auditor → QC</small></div>
        <div><b>{fmtDuration(m.avgQcToGovMs)}</b><br /><small>QC → Governance</small></div>
        <div><b>{fmtDuration(m.avgGovToMgmtMs)}</b><br /><small>Governance → Management</small></div>
        <div><b>{m.govApproved} / {m.govEscalated}</b><br /><small>Governance approved / escalated</small></div>
      </div>
    </section>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>{table('By ticket type', m.byType)}{table('By AI risk level', m.byRisk)}</div>
  </>;
}
