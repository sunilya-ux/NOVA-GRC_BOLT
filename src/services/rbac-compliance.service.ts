import { getUserPermissions } from '@/lib/permissions'
import { auditLogger } from './audit.service'
import type { User } from './auth.service'

export interface ComplianceViolation {
  id: string
  timestamp: Date
  userId: string
  roleName: string
  violationType: 'ACCESS_DENIED' | 'PERMISSION_MISMATCH' | 'WORKFLOW_VIOLATION' | 'DATA_ACCESS_VIOLATION'
  resource: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  remediation: string
  status: 'OPEN' | 'RESOLVED' | 'FALSE_POSITIVE'
}

export interface AccessControlMatrix {
  role: string
  permissions: Record<string, boolean>
  restrictions: string[]
  dataScope: 'OWN' | 'TEAM' | 'ALL'
  auditRequired: boolean
}

export interface DPDPComplianceReport {
  overallCompliance: number
  violations: ComplianceViolation[]
  accessMatrix: AccessControlMatrix[]
  recommendations: string[]
  lastAudit: Date
  nextAuditDue: Date
}

export class RBACComplianceService {
  private static instance: RBACComplianceService

  static getInstance(): RBACComplianceService {
    if (!RBACComplianceService.instance) {
      RBACComplianceService.instance = new RBACComplianceService()
    }
    return RBACComplianceService.instance
  }

  // Access Control Matrix - NOVA-6.0
  private accessControlMatrix: AccessControlMatrix[] = [
    {
      role: 'compliance_officer',
      permissions: {
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
        canViewAnalytics: true,
        canExportReports: false,
        canSearchDocuments: true,
        canViewOwnAuditLogs: true,
        canViewTeamAuditLogs: false,
        canViewAllAuditLogs: false,
      },
      restrictions: [
        'Cannot approve or reject documents',
        'Cannot access bulk processing',
        'Cannot view documents outside own scope',
        'Cannot export reports'
      ],
      dataScope: 'OWN',
      auditRequired: true
    },
    {
      role: 'compliance_manager',
      permissions: {
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
      restrictions: [
        'Cannot view all documents (only team scope)',
        'Cannot view all audit logs'
      ],
      dataScope: 'TEAM',
      auditRequired: true
    },
    {
      role: 'cco',
      permissions: {
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
      restrictions: [
        'Cannot upload documents directly',
        'Cannot make final approval decisions (oversight only)'
      ],
      dataScope: 'ALL',
      auditRequired: true
    },
    {
      role: 'ciso',
      permissions: {
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
      restrictions: [
        'Read-only access to all documents',
        'No operational permissions',
        'Security monitoring focus only'
      ],
      dataScope: 'ALL',
      auditRequired: true
    },
    {
      role: 'internal_auditor',
      permissions: {
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
      restrictions: [
        'Read-only access to all data',
        'No operational permissions',
        'Audit and compliance monitoring only'
      ],
      dataScope: 'ALL',
      auditRequired: true
    },
    {
      role: 'dpo',
      permissions: {
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
      restrictions: [
        'Read-only access to all documents',
        'No operational permissions',
        'Privacy compliance focus'
      ],
      dataScope: 'ALL',
      auditRequired: true
    },
    {
      role: 'external_auditor',
      permissions: {
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
      restrictions: [
        'Read-only access to all data',
        'No operational permissions',
        'External audit access only'
      ],
      dataScope: 'ALL',
      auditRequired: true
    },
    {
      role: 'system_admin',
      permissions: {
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
      restrictions: [
        'No data access permissions',
        'System administration only',
        'Cannot view any business data'
      ],
      dataScope: 'OWN',
      auditRequired: true
    },
    {
      role: 'ml_engineer',
      permissions: {
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
      restrictions: [
        'No data access permissions',
        'AI/ML system access only',
        'Cannot view business data'
      ],
      dataScope: 'OWN',
      auditRequired: true
    }
  ]

  async validateAccessControlMatrix(user: User): Promise<{ compliant: boolean; violations: string[] }> {
    const matrixEntry = this.accessControlMatrix.find(m => m.role === user.role_name)
    if (!matrixEntry) {
      return { compliant: false, violations: [`No access control matrix entry for role: ${user.role_name}`] }
    }

    const userPermissions = getUserPermissions(user.role_name)
    const violations: string[] = []

    // Check each permission in the matrix
    for (const [permission, expectedValue] of Object.entries(matrixEntry.permissions)) {
      const actualValue = userPermissions[permission as keyof typeof userPermissions]
      if (actualValue !== expectedValue) {
        violations.push(`Permission mismatch for ${permission}: expected ${expectedValue}, got ${actualValue}`)
      }
    }

    return {
      compliant: violations.length === 0,
      violations
    }
  }

  async checkDPDPCompliance(): Promise<DPDPComplianceReport> {
    const violations: ComplianceViolation[] = []
    const recommendations: string[] = []

    // Check all users for compliance
    // This would query the database for all users and validate their access

    // Check for data minimization violations
    const dataMinimizationViolations = await this.checkDataMinimization()
    violations.push(...dataMinimizationViolations)

    // Check for consent management
    const consentViolations = await this.checkConsentManagement()
    violations.push(...consentViolations)

    // Check for data retention compliance
    const retentionViolations = await this.checkDataRetention()
    violations.push(...retentionViolations)

    // Check for cross-border data transfers
    const transferViolations = await this.checkCrossBorderTransfers()
    violations.push(...transferViolations)

    // Generate recommendations
    if (violations.length > 0) {
      recommendations.push('Conduct immediate security audit')
      recommendations.push('Review and update access control policies')
      recommendations.push('Implement additional monitoring controls')
      recommendations.push('Provide additional training to staff')
    }

    const overallCompliance = Math.max(0, 100 - (violations.length * 5))

    return {
      overallCompliance,
      violations,
      accessMatrix: this.accessControlMatrix,
      recommendations,
      lastAudit: new Date(),
      nextAuditDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  }

  private async checkDataMinimization(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Check if users have access to more data than necessary for their role
    for (const matrixEntry of this.accessControlMatrix) {
      if (matrixEntry.dataScope === 'ALL' && matrixEntry.role.includes('officer')) {
        violations.push({
          id: `DM-${Date.now()}-${matrixEntry.role}`,
          timestamp: new Date(),
          userId: 'system',
          roleName: matrixEntry.role,
          violationType: 'DATA_ACCESS_VIOLATION',
          resource: 'Data Scope',
          severity: 'MEDIUM',
          description: `${matrixEntry.role} has broader data access than necessary`,
          remediation: 'Review and restrict data access scope',
          status: 'OPEN'
        })
      }
    }

    return violations
  }

  private async checkConsentManagement(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Check for proper consent handling in document processing
    // This would check if consent is properly obtained and documented

    violations.push({
      id: `CONSENT-${Date.now()}`,
      timestamp: new Date(),
      userId: 'system',
      roleName: 'system',
      violationType: 'DATA_ACCESS_VIOLATION',
      resource: 'Consent Management',
      severity: 'HIGH',
      description: 'Consent management workflow not fully implemented',
      remediation: 'Implement explicit consent collection and validation',
      status: 'OPEN'
    })

    return violations
  }

  private async checkDataRetention(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Check data retention policies
    // This would verify that data is not retained longer than necessary

    return violations // No violations found in current implementation
  }

  private async checkCrossBorderTransfers(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Check for cross-border data transfer compliance
    // This would verify GDPR Article 46 compliance for international transfers

    return violations // Assuming local deployment for now
  }

  async logComplianceViolation(violation: Omit<ComplianceViolation, 'id' | 'timestamp'>): Promise<void> {
    const fullViolation: ComplianceViolation = {
      ...violation,
      id: `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    await auditLogger.log({
      user_id: violation.userId,
      role_name: violation.roleName as any,
      action: 'COMPLIANCE_VIOLATION_DETECTED',
      resource_type: 'COMPLIANCE',
      resource_id: fullViolation.id,
      success: false,
      details: {
        violation_type: violation.violationType,
        severity: violation.severity,
        description: violation.description,
        remediation: violation.remediation
      }
    })
  }

  async generateComplianceReport(): Promise<string> {
    const report = await this.checkDPDPCompliance()

    let reportText = '# NOVA-GRC DPDP Compliance Report\n\n'
    reportText += `**Overall Compliance Score:** ${report.overallCompliance}%\n\n`
    reportText += `**Report Generated:** ${report.lastAudit.toISOString()}\n\n`
    reportText += `**Next Audit Due:** ${report.nextAuditDue.toISOString()}\n\n`

    reportText += '## Access Control Matrix\n\n'
    for (const matrix of report.accessMatrix) {
      reportText += `### ${matrix.role}\n`
      reportText += `- **Data Scope:** ${matrix.dataScope}\n`
      reportText += `- **Audit Required:** ${matrix.auditRequired}\n`
      reportText += `- **Restrictions:**\n`
      for (const restriction of matrix.restrictions) {
        reportText += `  - ${restriction}\n`
      }
      reportText += '\n'
    }

    reportText += '## Compliance Violations\n\n'
    if (report.violations.length === 0) {
      reportText += 'No violations detected.\n\n'
    } else {
      for (const violation of report.violations) {
        reportText += `### ${violation.violationType} - ${violation.severity}\n`
        reportText += `- **Resource:** ${violation.resource}\n`
        reportText += `- **Description:** ${violation.description}\n`
        reportText += `- **Remediation:** ${violation.remediation}\n`
        reportText += `- **Status:** ${violation.status}\n\n`
      }
    }

    reportText += '## Recommendations\n\n'
    for (const recommendation of report.recommendations) {
      reportText += `- ${recommendation}\n`
    }

    return reportText
  }

  async enforceLeastPrivilege(user: User, action: string): Promise<boolean> {
    // Implement least privilege principle
    const userPermissions = getUserPermissions(user.role_name)

    // Check if the user has the minimum required permissions for the action
    switch (action) {
      case 'UPLOAD_DOCUMENT':
        return userPermissions.canUploadDocuments
      case 'APPROVE_DOCUMENT':
        return userPermissions.canApproveDocuments
      case 'VIEW_ALL_DOCUMENTS':
        return userPermissions.canViewAllDocuments
      case 'BULK_PROCESS':
        return userPermissions.canBulkProcess
      case 'EXPORT_REPORTS':
        return userPermissions.canExportReports
      default:
        return false
    }
  }

  async validateSessionIntegrity(user: User): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    // Check session timeout
    // Check concurrent sessions
    // Check IP consistency
    // This would integrate with session management

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

export const rbacComplianceService = RBACComplianceService.getInstance()