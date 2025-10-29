import type { RoleName } from './database.types'

interface RoutePermissions {
  path: string
  label: string
  allowedRoles: RoleName[]
}

export interface FeaturePermission {
  canUploadDocuments: boolean
  canViewOwnDocuments: boolean
  canViewTeamDocuments: boolean
  canViewAllDocuments: boolean
  canProcessDocuments: boolean
  canApproveDocuments: boolean
  canRejectDocuments: boolean
  canReassignDocuments: boolean
  canProvideReviewFeedback: boolean
  canOverrideAI: boolean
  canBulkProcess: boolean
  canViewAnalytics: boolean
  canExportReports: boolean
  canSearchDocuments: boolean
  canViewOwnAuditLogs: boolean
  canViewTeamAuditLogs: boolean
  canViewAllAuditLogs: boolean
}

const roleFeaturePermissions: Record<RoleName, FeaturePermission> = {
  compliance_officer: {
    canUploadDocuments: true,
    canViewOwnDocuments: true,
    canViewTeamDocuments: false,
    canViewAllDocuments: false,
    canProcessDocuments: true,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: true,
    canOverrideAI: false,
    canBulkProcess: false,
    canViewAnalytics: false,
    canExportReports: false,
    canSearchDocuments: true,
    canViewOwnAuditLogs: true,
    canViewTeamAuditLogs: false,
    canViewAllAuditLogs: false,
  },
  compliance_manager: {
    canUploadDocuments: true,
    canViewOwnDocuments: true,
    canViewTeamDocuments: true,
    canViewAllDocuments: false,
    canProcessDocuments: true,
    canApproveDocuments: true,
    canRejectDocuments: true,
    canReassignDocuments: true,
    canProvideReviewFeedback: true,
    canOverrideAI: true,
    canBulkProcess: true,
    canViewAnalytics: true,
    canExportReports: true,
    canSearchDocuments: true,
    canViewOwnAuditLogs: true,
    canViewTeamAuditLogs: true,
    canViewAllAuditLogs: false,
  },
  cco: {
    canUploadDocuments: false,
    canViewOwnDocuments: true,
    canViewTeamDocuments: true,
    canViewAllDocuments: true,
    canProcessDocuments: true,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: true,
    canOverrideAI: true,
    canBulkProcess: true,
    canViewAnalytics: true,
    canExportReports: true,
    canSearchDocuments: true,
    canViewOwnAuditLogs: true,
    canViewTeamAuditLogs: true,
    canViewAllAuditLogs: true,
  },
  ciso: {
    canUploadDocuments: false,
    canViewOwnDocuments: false,
    canViewTeamDocuments: false,
    canViewAllDocuments: true,
    canProcessDocuments: false,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: false,
    canOverrideAI: false,
    canBulkProcess: false,
    canViewAnalytics: true,
    canExportReports: true,
    canSearchDocuments: true,
    canViewOwnAuditLogs: true,
    canViewTeamAuditLogs: true,
    canViewAllAuditLogs: true,
  },
  system_admin: {
    canUploadDocuments: false,
    canViewOwnDocuments: false,
    canViewTeamDocuments: false,
    canViewAllDocuments: false,
    canProcessDocuments: false,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: false,
    canOverrideAI: false,
    canBulkProcess: false,
    canViewAnalytics: false,
    canExportReports: false,
    canSearchDocuments: false,
    canViewOwnAuditLogs: false,
    canViewTeamAuditLogs: false,
    canViewAllAuditLogs: false,
  },
  ml_engineer: {
    canUploadDocuments: false,
    canViewOwnDocuments: false,
    canViewTeamDocuments: false,
    canViewAllDocuments: false,
    canProcessDocuments: false,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: false,
    canOverrideAI: false,
    canBulkProcess: false,
    canViewAnalytics: false,
    canExportReports: false,
    canSearchDocuments: false,
    canViewOwnAuditLogs: false,
    canViewTeamAuditLogs: false,
    canViewAllAuditLogs: false,
  },
  internal_auditor: {
    canUploadDocuments: false,
    canViewOwnDocuments: true,
    canViewTeamDocuments: true,
    canViewAllDocuments: true,
    canProcessDocuments: false,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: false,
    canOverrideAI: false,
    canBulkProcess: false,
    canViewAnalytics: true,
    canExportReports: true,
    canSearchDocuments: true,
    canViewOwnAuditLogs: true,
    canViewTeamAuditLogs: true,
    canViewAllAuditLogs: true,
  },
  dpo: {
    canUploadDocuments: false,
    canViewOwnDocuments: false,
    canViewTeamDocuments: false,
    canViewAllDocuments: true,
    canProcessDocuments: false,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: false,
    canOverrideAI: false,
    canBulkProcess: false,
    canViewAnalytics: true,
    canExportReports: true,
    canSearchDocuments: true,
    canViewOwnAuditLogs: true,
    canViewTeamAuditLogs: false,
    canViewAllAuditLogs: true,
  },
  external_auditor: {
    canUploadDocuments: false,
    canViewOwnDocuments: false,
    canViewTeamDocuments: false,
    canViewAllDocuments: true,
    canProcessDocuments: false,
    canApproveDocuments: false,
    canRejectDocuments: false,
    canReassignDocuments: false,
    canProvideReviewFeedback: false,
    canOverrideAI: false,
    canBulkProcess: false,
    canViewAnalytics: true,
    canExportReports: true,
    canSearchDocuments: true,
    canViewOwnAuditLogs: false,
    canViewTeamAuditLogs: false,
    canViewAllAuditLogs: true,
  },
}

export function getUserPermissions(role: RoleName): FeaturePermission {
  return roleFeaturePermissions[role]
}

export const routePermissions: RoutePermissions[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    allowedRoles: [
      'compliance_officer',
      'compliance_manager',
      'cco',
      'ciso',
      'system_admin',
      'ml_engineer',
      'internal_auditor',
      'dpo',
      'external_auditor'
    ]
  },
  {
    path: '/upload',
    label: 'Upload',
    allowedRoles: ['compliance_officer', 'compliance_manager']
  },
  {
    path: '/processing',
    label: 'Processing',
    allowedRoles: ['compliance_officer', 'compliance_manager', 'cco', 'internal_auditor']
  },
  {
    path: '/review',
    label: 'Review',
    allowedRoles: ['compliance_officer', 'compliance_manager', 'cco', 'internal_auditor']
  },
  {
    path: '/search',
    label: 'Search',
    allowedRoles: [
      'compliance_officer',
      'compliance_manager',
      'cco',
      'ciso',
      'internal_auditor',
      'dpo',
      'external_auditor'
    ]
  },
  {
    path: '/analytics',
    label: 'Analytics',
    allowedRoles: ['compliance_manager', 'cco', 'ciso', 'internal_auditor', 'dpo', 'external_auditor']
  },
  {
    path: '/bulk',
    label: 'Bulk',
    allowedRoles: ['compliance_manager', 'cco']
  }
]

export function hasRouteAccess(userRole: RoleName, path: string): boolean {
  const route = routePermissions.find(r => r.path === path)
  if (!route) return false
  return route.allowedRoles.includes(userRole)
}

export function getAccessibleRoutes(userRole: RoleName): RoutePermissions[] {
  return routePermissions.filter(route => route.allowedRoles.includes(userRole))
}
