import type { RawTicket } from '../types/audit';

/** NTT DATA-style simulated source records with synthetic evidence records (demo only). No assessment or auditor decision is stored here. */
export const demoTickets: RawTicket[] = [
  {
    "ticketId": "INC-3001",
    "ticketType": "Incident",
    "title": "Payment gateway timeout during checkout",
    "priority": "P1",
    "description": "Customers unable to complete card payments; escalated by service desk.",
    "createdDate": "2026-10-05T08:10:00",
    "resolutionDate": "2026-10-05T11:40:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Approved via standard process",
    "resolutionNotes": "Root cause: expired TLS certificate on gateway node 2. Certificate renewed, transactions verified, monitoring alert added.",
    "resolutionQuality": "Good",
    "escalationEvidence": "Service desk escalated to the payments platform team within 10 minutes; the escalation is recorded in the incident activity log.",
    "rootCauseEvidence": "Root cause: expired TLS certificate on gateway node 2. Certificate renewed, transactions verified, monitoring alert added.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-INC-3001-INC-A1",
        "ticketId": "INC-3001",
        "ruleId": "INC-A1",
        "sourceLabel": "Synthetic SLA response compliance source record",
        "content": "Within SLA",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3001-INC-A2",
        "ticketId": "INC-3001",
        "ruleId": "INC-A2",
        "sourceLabel": "Synthetic Escalation procedure documented source record",
        "content": "Service desk escalated to the payments platform team within 10 minutes; the escalation is recorded in the incident activity log.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3001-INC-B1",
        "ticketId": "INC-3001",
        "ruleId": "INC-B1",
        "sourceLabel": "Synthetic Root cause documentation source record",
        "content": "Root cause: expired TLS certificate on gateway node 2. Certificate renewed, transactions verified, monitoring alert added.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "INC-3002",
    "ticketType": "Incident",
    "title": "Core banking batch job failed overnight",
    "priority": "P1",
    "description": "Nightly settlement batch failed; finance reporting delayed.",
    "createdDate": "2026-10-05T23:30:00",
    "resolutionDate": "2026-10-06T09:30:00",
    "slaStatus": "Breached by 6 hours",
    "approvalStatus": "Missing approval evidence",
    "resolutionNotes": "Fixed.",
    "resolutionQuality": "Poor",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-INC-3002-INC-A1",
        "ticketId": "INC-3002",
        "ruleId": "INC-A1",
        "sourceLabel": "Synthetic SLA response compliance source record",
        "content": "Breached by 6 hours",
        "state": "VALIDATED_CONTRADICTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "INC-3003",
    "ticketType": "Incident",
    "title": "VPN drops for remote staff",
    "priority": "P2",
    "description": "Intermittent disconnects reported by 40+ users across two sites.",
    "createdDate": "2026-10-06T09:00:00",
    "resolutionDate": "2026-10-06T15:00:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Approved via standard process",
    "resolutionNotes": "Firewall session timeout adjusted from 300s to 3600s. Confirmed stable over 4 hours with users.",
    "resolutionQuality": "Good",
    "escalationEvidence": "Network operations took ownership after the service desk escalation; the escalation path is recorded in the activity log.",
    "rootCauseEvidence": "Firewall session timeout adjusted from 300s to 3600s. Confirmed stable over 4 hours with users.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-INC-3003-INC-A1",
        "ticketId": "INC-3003",
        "ruleId": "INC-A1",
        "sourceLabel": "Synthetic SLA response compliance source record",
        "content": "Within SLA",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3003-INC-A2",
        "ticketId": "INC-3003",
        "ruleId": "INC-A2",
        "sourceLabel": "Synthetic Escalation procedure documented source record",
        "content": "Network operations took ownership after the service desk escalation; the escalation path is recorded in the activity log.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3003-INC-B1",
        "ticketId": "INC-3003",
        "ruleId": "INC-B1",
        "sourceLabel": "Synthetic Root cause documentation source record",
        "content": "Firewall session timeout adjusted from 300s to 3600s. Confirmed stable over 4 hours with users.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "SR-3004",
    "ticketType": "Service Request",
    "title": "New starter access bundle - Finance",
    "priority": "P3",
    "description": "Access bundle for 3 new finance joiners.",
    "createdDate": "2026-10-06T10:00:00",
    "resolutionDate": "2026-10-07T10:00:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Approved via standard process",
    "resolutionNotes": "Accounts created, mailbox and ERP read access granted per HR form HR-2291. Manager confirmed.",
    "resolutionQuality": "Good",
    "fulfilmentEvidence": "Accounts created, mailbox and ERP read access granted per HR form HR-2291; the manager confirmed completion.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-SR-3004-SR-A1",
        "ticketId": "SR-3004",
        "ruleId": "SR-A1",
        "sourceLabel": "Synthetic SLA fulfilment compliance source record",
        "content": "Within SLA",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-SR-3004-SR-B1",
        "ticketId": "SR-3004",
        "ruleId": "SR-B1",
        "sourceLabel": "Synthetic Fulfilment documentation source record",
        "content": "Accounts created, mailbox and ERP read access granted per HR form HR-2291; the manager confirmed completion.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-SR-3004-SR-B2",
        "ticketId": "SR-3004",
        "ruleId": "SR-B2",
        "sourceLabel": "Synthetic Approval evidence source record",
        "content": "Approved via standard process",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "SR-3005",
    "ticketType": "Service Request",
    "title": "VIP executive laptop replacement",
    "priority": "P2",
    "description": "Replacement for failed device, CFO office.",
    "createdDate": "2026-10-07T08:00:00",
    "resolutionDate": "2026-10-08T14:00:00",
    "slaStatus": "Breached by 4 hours",
    "approvalStatus": "Approved via standard process",
    "resolutionNotes": "Done",
    "resolutionQuality": "Fair",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-SR-3005-SR-A1",
        "ticketId": "SR-3005",
        "ruleId": "SR-A1",
        "sourceLabel": "Synthetic SLA fulfilment compliance source record",
        "content": "Breached by 4 hours",
        "state": "VALIDATED_CONTRADICTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-SR-3005-SR-B2",
        "ticketId": "SR-3005",
        "ruleId": "SR-B2",
        "sourceLabel": "Synthetic Approval evidence source record",
        "content": "Approved via standard process",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "SR-3006",
    "ticketType": "Service Request",
    "title": "Software licence - design tool",
    "priority": "P4",
    "description": "Licence for one marketing designer.",
    "createdDate": "2026-10-07T13:00:00",
    "resolutionDate": "2026-10-08T11:00:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Approved via standard process",
    "resolutionNotes": "Licence assigned from existing pool. Requester confirmed access. Cost centre updated.",
    "resolutionQuality": "Good",
    "fulfilmentEvidence": "Licence assigned from the existing pool; the requester confirmed access and the cost centre was updated.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-SR-3006-SR-A1",
        "ticketId": "SR-3006",
        "ruleId": "SR-A1",
        "sourceLabel": "Synthetic SLA fulfilment compliance source record",
        "content": "Within SLA",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-SR-3006-SR-B1",
        "ticketId": "SR-3006",
        "ruleId": "SR-B1",
        "sourceLabel": "Synthetic Fulfilment documentation source record",
        "content": "Licence assigned from the existing pool; the requester confirmed access and the cost centre was updated.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-SR-3006-SR-B2",
        "ticketId": "SR-3006",
        "ruleId": "SR-B2",
        "sourceLabel": "Synthetic Approval evidence source record",
        "content": "Approved via standard process",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "CR-3007",
    "ticketType": "Change Request",
    "title": "Emergency firewall rule rollback",
    "priority": "P1",
    "description": "Rollback after rule change blocked partner API traffic.",
    "createdDate": "2026-10-08T01:00:00",
    "resolutionDate": "2026-10-08T07:30:00",
    "slaStatus": "Breached by 3 hours",
    "approvalStatus": "Missing CAB approval evidence",
    "resolutionNotes": "N/A",
    "resolutionQuality": "Poor",
    "preImplementationEvidence": "Rollback plan agreed on the incident bridge before the change was implemented.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-CR-3007-CHG-A2",
        "ticketId": "CR-3007",
        "ruleId": "CHG-A2",
        "sourceLabel": "Synthetic Pre-implementation review source record",
        "content": "Rollback plan agreed on the incident bridge before the change was implemented.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "CR-3008",
    "ticketType": "Change Request",
    "title": "SSL certificate renewal - intranet",
    "priority": "P3",
    "description": "Planned renewal ahead of expiry.",
    "createdDate": "2026-10-08T09:00:00",
    "resolutionDate": "2026-10-08T17:00:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Approved via standard process",
    "resolutionNotes": "Certificate installed during maintenance window, validity and chain verified, rollback plan not required.",
    "resolutionQuality": "Good",
    "preImplementationEvidence": "Planned renewal reviewed for scope and risk; certificate and chain validation included in the maintenance-window plan.",
    "postImplementationEvidence": "Certificate installed during the maintenance window; validity and chain verified; rollback plan not required.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-CR-3008-CHG-A1",
        "ticketId": "CR-3008",
        "ruleId": "CHG-A1",
        "sourceLabel": "Synthetic Change authorization evidence source record",
        "content": "Approved via standard process",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-CR-3008-CHG-A2",
        "ticketId": "CR-3008",
        "ruleId": "CHG-A2",
        "sourceLabel": "Synthetic Pre-implementation review source record",
        "content": "Planned renewal reviewed for scope and risk; certificate and chain validation included in the maintenance-window plan.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-CR-3008-CHG-B1",
        "ticketId": "CR-3008",
        "ruleId": "CHG-B1",
        "sourceLabel": "Synthetic Post-implementation verification source record",
        "content": "Certificate installed during the maintenance window; validity and chain verified; rollback plan not required.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "CR-3009",
    "ticketType": "Change Request",
    "title": "Database index rebuild - routine",
    "priority": "P3",
    "description": "Quarterly index maintenance on reporting DB.",
    "createdDate": "2026-10-09T18:00:00",
    "resolutionDate": "2026-10-10T02:00:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Missing CAB approval evidence",
    "resolutionNotes": "Completed.",
    "resolutionQuality": "Fair",
    "preImplementationEvidence": "Quarterly index maintenance reviewed for scope and impact on the reporting database.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-CR-3009-CHG-A2",
        "ticketId": "CR-3009",
        "ruleId": "CHG-A2",
        "sourceLabel": "Synthetic Pre-implementation review source record",
        "content": "Quarterly index maintenance reviewed for scope and impact on the reporting database.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "INC-3010",
    "ticketType": "Incident",
    "title": "Shared drive access denied - HR",
    "priority": "P3",
    "description": "HR team lost access to confidential folder after group clean-up.",
    "createdDate": "2026-10-09T09:30:00",
    "resolutionDate": "2026-10-09T13:30:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Approved via standard process",
    "resolutionNotes": "Group membership restored; clean-up script excluded HR-Confidential going forward. User confirmed.",
    "resolutionQuality": "Good",
    "escalationEvidence": "HR service desk escalated to the directory team; ownership is recorded in the activity log.",
    "rootCauseEvidence": "The group clean-up script removed HR-Confidential membership; membership restored and the script updated to exclude the group.",
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-INC-3010-INC-A1",
        "ticketId": "INC-3010",
        "ruleId": "INC-A1",
        "sourceLabel": "Synthetic SLA response compliance source record",
        "content": "Within SLA",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3010-INC-A2",
        "ticketId": "INC-3010",
        "ruleId": "INC-A2",
        "sourceLabel": "Synthetic Escalation procedure documented source record",
        "content": "HR service desk escalated to the directory team; ownership is recorded in the activity log.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3010-INC-B1",
        "ticketId": "INC-3010",
        "ruleId": "INC-B1",
        "sourceLabel": "Synthetic Root cause documentation source record",
        "content": "The group clean-up script removed HR-Confidential membership; membership restored and the script updated to exclude the group.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      }
    ]
  },
  {
    "ticketId": "INC-3011",
    "ticketType": "Incident",
    "title": "Repeated assignment handoffs for a resolved access issue",
    "priority": "P2",
    "description": "Users reported an access issue; the ticket passed automated controls but was reassigned repeatedly between support groups.",
    "createdDate": "2026-10-10T09:00:00",
    "resolutionDate": "2026-10-10T14:00:00",
    "slaStatus": "Within SLA",
    "approvalStatus": "Not required",
    "resolutionNotes": "Access restored and requester confirmed service recovery; follow-up observation is not yet independently verified.",
    "resolutionQuality": "Good",
    "escalationEvidence": "Support lead reviewed the escalation route and approved the handoff records in the activity log.",
    "rootCauseEvidence": "Identity service queue configuration caused temporary access denial, documented by the resolver group.",
    "reassignmentCount": 5,
    "reopenCount": 0,
    "activityCount": 12,
    "groupDiversity": 4,
    "synthetic": true,
    "evidenceRecords": [
      {
        "id": "DEMO-INC-3011-INC-A1",
        "ticketId": "INC-3011",
        "ruleId": "INC-A1",
        "sourceLabel": "Synthetic SLA response compliance source record",
        "content": "Within SLA",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3011-INC-A2",
        "ticketId": "INC-3011",
        "ruleId": "INC-A2",
        "sourceLabel": "Synthetic Escalation procedure documented source record",
        "content": "Support lead reviewed the escalation route and approved the handoff records in the activity log.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "DEMO-INC-3011-INC-B1",
        "ticketId": "INC-3011",
        "ruleId": "INC-B1",
        "sourceLabel": "Synthetic Root cause documentation source record",
        "content": "Identity service queue configuration caused temporary access denial, documented by the resolver group.",
        "state": "VALIDATED_SUPPORTS",
        "reviewedBy": "Synthetic independent reference reviewer",
        "reviewedAt": "2026-08-20T09:00:00Z",
        "synthetic": true
      },
      {
        "id": "SAMPLE-INC-3011-HANDOFFS",
        "ticketId": "INC-3011",
        "ruleId": "BEH-HANDOFF",
        "sourceLabel": "Synthetic assignment activity timeline",
        "content": "09:00 Service Desk → 09:20 IAM → 10:05 Network → 11:10 Service Desk → 12:00 IAM → 13:00 Identity Platform. Five reassignments across four groups. Whether these handoffs were justified remains an auditor judgement.",
        "state": "SUPPLIED_UNVALIDATED",
        "synthetic": true
      }
    ]
  }
];

