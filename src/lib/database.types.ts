export type RoleName =
  | 'compliance_officer'
  | 'compliance_manager'
  | 'cco'
  | 'ciso'
  | 'system_admin'
  | 'ml_engineer'
  | 'internal_auditor'
  | 'dpo'
  | 'external_auditor'

export type RoleType =
  | 'Operational'
  | 'Supervisory'
  | 'Executive'
  | 'Technical'
  | 'Assurance'

export type DataScope = 'own' | 'team' | 'department' | 'all' | 'none'

export type DocumentType = 'PAN' | 'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other'

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'ocr_complete'
  | 'classified'
  | 'approved'
  | 'rejected'
  | 'needs_review'

export type DecisionStatus =
  | 'ai_proposed'
  | 'officer_reviewed'
  | 'pending_manager_approval'
  | 'manager_approved'
  | 'manager_rejected'
  | 'cco_escalated'
  | 'final'

export type AIVerdict = 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW'
export type OfficerAction = 'AGREE' | 'DISAGREE'
export type ManagerAction = 'APPROVE' | 'REJECT' | 'ESCALATE'
