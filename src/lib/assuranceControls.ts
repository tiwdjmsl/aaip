/* Evidence-based control checklist (ported from the evidence build). */
import type { RawTicket } from '../types/audit';

export type Result = 'PASS' | 'FAIL' | 'NOT_ASSESSED' | 'NOT_APPLICABLE' | 'JUDGEMENT';
export type EvidenceState = 'VALIDATED_SUPPORTS' | 'VALIDATED_CONTRADICTS' | 'SUPPLIED_UNVALIDATED' | 'NOT_SUPPLIED' | 'HUMAN_JUDGEMENT_REQUIRED';
export type Rule = { id: string; label: string; tier: 'A' | 'B' | 'C'; area: string; field?: string; method: 'automated' | 'human'; evidenceRequirement: string; weightKey?: string };
export type ControlItem = Rule & { ruleId: string; version: number; applicableTicketType: string; result: Result; evidenceStatus: EvidenceState; evidence: string; evidenceRef: string };
type Rules = { enabled?: Record<string, boolean>; version?: number };

const normalise = (v: unknown) => String(v ?? "").normalize("NFKC").trim().toLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ").replace(/[.!]$/, "");
export const absent = (v: unknown) => !normalise(v) || /^(n\/?a|none|not provided|not supplied|not available|no details|pending|unknown|not recorded|not tracked|incomplete|missing)$/.test(normalise(v));
export function classifySla(value: unknown) {
  const v = normalise(value);
  if (absent(v) || /\?|\b(?:unknown|uncertain|possibly|maybe|alleged|unconfirmed|not confirmed|pending clarification)\b/.test(v)) return "NOT_ASSESSED";
  if (/\b(?:breach avoided|avoided (?:an? )?(?:sla )?breach)\b/.test(v)) return "NOT_ASSESSED";
  if (/\b(?:no (?:sla )?breach|not breached|without (?:an? )?(?:sla )?breach)\b/.test(v)) {
    const remaining = v.replace(/\b(?:no (?:sla )?breach|not breached|without (?:an? )?(?:sla )?breach)\b/g, "");
    return /not within (?:the )?sla|outside (?:the )?sla|breached|sla not met/.test(remaining) || !/^(?:no (?:sla )?breach|not breached|without (?:an? )?(?:sla )?breach)(?: (?:recorded|observed|reported|detected))?$/.test(v) ? "NOT_ASSESSED" : "PASS";
  }
  if (/\b(?:not within (?:the )?sla|outside (?:the )?sla|sla not met|sla missed|breached(?:\s|$)|sla breach(?:\s|$)|overdue|failed sla)\b/.test(v) || /^breach(?: by| of|$)/.test(v)) return "FAIL";
  if (/^(?:within (?:the )?sla|met sla|sla met|on time|compliant)(?:\s*\([0-9.]+\s*(?:hours?|minutes?|days?)\))?$/.test(v)) return "PASS";
  return "NOT_ASSESSED";
}
export function classifyApproval(value: unknown) {
  const v = normalise(value);
  if (absent(v) || /\?|\b(?:unknown|uncertain|possibly|maybe|alleged|unconfirmed|not confirmed|pending clarification)\b/.test(v)) return "NOT_ASSESSED";
  if (/^(?:not required|no approval required|approval not required)$/.test(v)) return "NOT_APPLICABLE";
  if (/\bno (?:missing|absent)\b.*\bapproval\b|\bapproval(?: evidence)? (?:is )?not missing\b/.test(v)) return "NOT_ASSESSED";
  if (/\b(?:not approved|unapproved|rejected|not authorised|not authorized|unauthorised|unauthorized)\b/.test(v)) return "FAIL";
  if (/\b(?:missing|absent|not provided|not found)\b.*\b(?:approval|authorization|authorisation)\b/.test(v) || /\b(?:approval|authorization|authorisation)\b.*\b(?:missing|absent|not provided|not found)\b/.test(v)) return "FAIL";
  if (/^(?:approved|authorised|authorized)(?:\s+(?:by|via)\b.*|\s*\([^)]*\))?$/.test(v)) return "PASS";
  return "NOT_ASSESSED";
}
export const RULES: Record<string, Rule[]> = {
  Incident: [
    { id: "INC-A1", label: "SLA response compliance", tier: "A" as const, area: "SLA", field: "slaStatus", method: "automated" as const, evidenceRequirement: "Structured SLA response status and source timing record", weightKey: "slaPenalty" },
    { id: "INC-A2", label: "Escalation procedure documented", tier: "A" as const, area: "escalation", field: "escalationEvidence", method: "automated" as const, evidenceRequirement: "Identifiable escalation/activity record reviewed against the procedure", weightKey: "documentationPenalty" },
    { id: "INC-B1", label: "Root cause documentation", tier: "B" as const, area: "docs", field: "rootCauseEvidence", method: "automated" as const, evidenceRequirement: "Identifiable root-cause record with reviewed supporting content", weightKey: "documentationPenalty" },
    { id: "INC-C1", label: "Resolution effectiveness", tier: "C" as const, area: "quality", method: "human" as const, evidenceRequirement: "Auditor evaluates resolution and subsequent service outcome" }
  ],
  "Change Request": [
    { id: "CHG-A1", label: "Change authorization evidence", tier: "A" as const, area: "approval", field: "approvalStatus", method: "automated" as const, evidenceRequirement: "CAB/authorisation record, reference and independent review state", weightKey: "approvalPenalty" },
    { id: "CHG-A2", label: "Pre-implementation review", tier: "A" as const, area: "scope", field: "preImplementationEvidence", method: "automated" as const, evidenceRequirement: "Reviewed change scope, risk and implementation plan", weightKey: "documentationPenalty" },
    { id: "CHG-B1", label: "Post-implementation verification", tier: "B" as const, area: "docs", field: "postImplementationEvidence", method: "automated" as const, evidenceRequirement: "Reviewed post-change validation results and reference", weightKey: "documentationPenalty" },
    { id: "CHG-C1", label: "Change impact assessment quality", tier: "C" as const, area: "quality", method: "human" as const, evidenceRequirement: "Auditor evaluates the impact assessment and residual risk" }
  ],
  "Service Request": [
    { id: "SR-A1", label: "SLA fulfilment compliance", tier: "A" as const, area: "SLA", field: "slaStatus", method: "automated" as const, evidenceRequirement: "Structured SLA fulfilment status and timing record", weightKey: "slaPenalty" },
    { id: "SR-B1", label: "Fulfilment documentation", tier: "B" as const, area: "docs", field: "fulfilmentEvidence", method: "automated" as const, evidenceRequirement: "Reviewed fulfilment evidence and acceptance record", weightKey: "documentationPenalty" },
    { id: "SR-B2", label: "Approval evidence", tier: "B" as const, area: "approval", field: "approvalStatus", method: "automated" as const, evidenceRequirement: "Required approval reference and reviewed source record", weightKey: "approvalPenalty" },
    { id: "SR-C1", label: "Service delivery quality", tier: "C" as const, area: "quality", method: "human" as const, evidenceRequirement: "Auditor evaluates delivery quality and requester outcome" }
  ]
};

type EvRecord = NonNullable<RawTicket['evidenceRecords']>[number];
export function evidenceFor(ticket: RawTicket, rule: Rule): { result: Result; state: EvidenceState; record?: EvRecord } {
  const record = (ticket.evidenceRecords || []).find(r => r.ruleId === rule.id && r.ticketId === ticket.ticketId);
  const reviewed = record && record.id && record.content && record.reviewedBy && record.reviewedAt;
  if (reviewed && record.state === 'VALIDATED_SUPPORTS') return { result: 'PASS', state: 'VALIDATED_SUPPORTS', record };
  if (reviewed && record.state === 'VALIDATED_CONTRADICTS') return { result: 'FAIL', state: 'VALIDATED_CONTRADICTS', record };
  const supplied = record || (rule.field && !absent((ticket as Record<string, unknown>)[rule.field]));
  return { result: 'NOT_ASSESSED', state: supplied ? 'SUPPLIED_UNVALIDATED' : 'NOT_SUPPLIED', record };
}
export function checklistFor(ticket: RawTicket, rules: Rules = {}) {
  const items: ControlItem[] = (RULES[ticket.ticketType] || []).map(rule => {
    const ev = evidenceFor(ticket, rule);
    let result: Result = ev.result;
    if (rule.method === 'human') result = 'JUDGEMENT';
    else if (rules.enabled?.[rule.id] === false) result = 'NOT_APPLICABLE';
    else if (rule.area === 'SLA') {
      const status = classifySla(ticket.slaStatus);
      result = status === 'FAIL' ? 'FAIL' : status === 'PASS' ? ev.result : 'NOT_ASSESSED';
    } else if (rule.area === 'approval') {
      const status = classifyApproval(ticket.approvalStatus);
      if (status === 'FAIL' && /missing|absent|not provided|not found/i.test(ticket.approvalStatus)) ev.state = 'NOT_SUPPLIED';
      result = status === 'FAIL' ? 'FAIL' : status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : status === 'PASS' ? ev.result : 'NOT_ASSESSED';
    }
    const raw = rule.field ? (ticket as Record<string, unknown>)[rule.field] : undefined;
    const rec = ev.record;
    return { ...rule, ruleId: rule.id, version: rules.version || 1, applicableTicketType: ticket.ticketType, result,
      evidenceStatus: rule.method === 'human' ? 'HUMAN_JUDGEMENT_REQUIRED' : ev.state,
      evidence: rec ? `${rec.id} \u00B7 ${rec.sourceLabel}\n${rec.content}\n${rec.synthetic ? 'SYNTHETIC DEMO reference outcome; ' : ''}${rec.state} \u00B7 ${rec.reviewedBy || 'unreviewed'} \u00B7 ${rec.reviewedAt || ''}` : `${rule.field || 'Tier C'}: ${raw ? String(raw) : 'Not supplied'}`,
      evidenceRef: rec?.id || `${ticket.ticketId}:${rule.field || rule.id}` };
  });
  const automated = items.filter(x => !['JUDGEMENT', 'NOT_APPLICABLE'].includes(x.result));
  const fails = automated.filter(x => x.result === 'FAIL');
  const notAssessed = automated.filter(x => x.result === 'NOT_ASSESSED');
  const gaps = automated.filter(x => x.result === 'NOT_ASSESSED' || x.evidenceStatus === 'NOT_SUPPLIED' || x.evidenceStatus === 'SUPPLIED_UNVALIDATED');
  const state = fails.length ? 'FAIL' : notAssessed.length || !automated.length ? 'NOT_ASSESSED' : 'HUMAN_REVIEW_PENDING';
  const label = !automated.length ? 'NO APPLICABLE AUTOMATED CONTROLS' : fails.length ? `FAIL \u00B7 ${fails.length} control exception(s)${gaps.length ? ` \u00B7 ${gaps.length} evidence gap(s)` : ''}` : notAssessed.length ? `INSUFFICIENT EVIDENCE \u00B7 ${notAssessed.length} unassessed` : 'AUTO CHECKS PASSED \u00B7 TIER C PENDING';
  return { items, fails, notAssessed, gaps, state, label, evidenceComplete: !gaps.length };
}
export function evidenceSources(ticket: RawTicket) {
  const fields = ['slaStatus', 'approvalStatus', 'resolutionNotes', 'escalationEvidence', 'rootCauseEvidence', 'preImplementationEvidence', 'postImplementationEvidence', 'fulfilmentEvidence', 'description'];
  return [
    ...(ticket.evidenceRecords || []).map(r => ({ id: r.id, label: `${r.id} \u00B7 ${r.sourceLabel}` })),
    ...fields.filter(k => !absent((ticket as Record<string, unknown>)[k])).map(k => ({ id: `${ticket.ticketId}:${k}`, label: `${ticket.ticketId}:${k}` })),
  ];
}
