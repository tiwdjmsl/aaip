export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type AuditStatus = 'Pending Review' | 'Reviewed' | 'Escalated';
export type AuditDecisionKind = 'Confirmed' | 'Overridden';

/** Source-system attributes only; audit outcomes are intentionally separate.
 * The four fields at the end are OPTIONAL -- most datasets (like the synthetic
 * demo set) won't have them, and the audit engine simply skips the related
 * checks when they're absent. Only richer exports (e.g. BPIC2014) populate these. */
export type RawTicket = {
  ticketId: string;
  ticketType: string;
  priority: string;
  title: string;
  description: string;
  createdDate: string;
  resolutionDate: string;
  slaStatus: string;
  approvalStatus: string;
  resolutionNotes: string;
  resolutionQuality: string;
  impact?: number;
  urgency?: number;
  reassignmentCount?: number;
  reopenTime?: string;
  reopenCount?: number;
  activityCount?: number;
  groupDiversity?: number;
  escalationEvidence?: string;
  rootCauseEvidence?: string;
  preImplementationEvidence?: string;
  postImplementationEvidence?: string;
  fulfilmentEvidence?: string;
  synthetic?: boolean;
  evidenceRecords?: {
    id: string; ticketId: string; ruleId: string; sourceLabel: string; content: string;
    state: 'VALIDATED_SUPPORTS' | 'VALIDATED_CONTRADICTS' | 'SUPPLIED_UNVALIDATED';
    reviewedBy?: string; reviewedAt?: string; synthetic?: boolean;
  }[];
};

export type AuditAssessment = {
  ticketId: string;
  complianceScore: number;
  riskLevel: RiskLevel;
  findings: string[];
  recommendations: string[];
  assessmentConfidence: number;
  anomalyDetected: boolean;
  resolutionHours: number | null;
  generatedAt: string;
};

export type AuditDecision = {
  ticketId: string;
  status: AuditStatus;
  kind?: AuditDecisionKind;
  decisionDate?: string;
  rationale?: string;
  overrideReason?: string;
  humanFinding?: 'Compliant' | 'Non-compliant';
  finalFinding?: string;
  evidenceRef?: string;
  evidenceReviewed?: boolean;
  version?: number;
  ruleVersion?: number;
};

export type AuditTrailEntry = {
  ticketId: string;
  event: 'AI assessment generated' | 'Auditor review completed' | 'Governance rule updated';
  occurredAt: string;
  decision?: AuditDecisionKind;
  rationale?: string;
  overrideReason?: string;
  recommendation?: string;
  confidence?: number;
  changedBy?: string;
};
