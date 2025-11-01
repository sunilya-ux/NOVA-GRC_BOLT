import { getUserPermissions } from '@/lib/permissions'
import { auditLogger } from './audit.service'
import type { User } from './auth.service'
import type { AIDecision } from './ai-decision-engine.service'

export interface WorkflowStep {
  id: string
  name: string
  requiredRoles: string[]
  requiredPermissions: string[]
  order: number
  isRequired: boolean
  timeoutHours?: number
}

export interface WorkflowInstance {
  workflowId: string
  documentId: string
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  pendingSteps: WorkflowStep[]
  status: 'active' | 'completed' | 'escalated' | 'rejected'
  createdAt: Date
  updatedAt: Date
  assignedUsers: User[]
  auditTrail: WorkflowAuditEntry[]
}

export interface WorkflowAuditEntry {
  timestamp: Date
  userId: string
  roleName: string
  action: string
  details: any
  ipAddress?: string
  userAgent?: string
}

export class RBACWorkflowService {
  private static instance: RBACWorkflowService

  static getInstance(): RBACWorkflowService {
    if (!RBACWorkflowService.instance) {
      RBACWorkflowService.instance = new RBACWorkflowService()
    }
    return RBACWorkflowService.instance
  }

  // Document Processing Workflow
  private documentProcessingWorkflow: WorkflowStep[] = [
    {
      id: 'upload',
      name: 'Document Upload',
      requiredRoles: ['compliance_officer', 'compliance_manager'],
      requiredPermissions: ['canUploadDocuments'],
      order: 1,
      isRequired: true
    },
    {
      id: 'ai_classification',
      name: 'AI Document Classification',
      requiredRoles: ['system'], // AI system role
      requiredPermissions: ['canProcessDocuments'],
      order: 2,
      isRequired: true
    },
    {
      id: 'officer_review',
      name: 'Compliance Officer Review',
      requiredRoles: ['compliance_officer', 'compliance_manager'],
      requiredPermissions: ['canProvideReviewFeedback'],
      order: 3,
      isRequired: true,
      timeoutHours: 24
    },
    {
      id: 'manager_approval',
      name: 'Manager Approval (if disagreed)',
      requiredRoles: ['compliance_manager', 'cco'],
      requiredPermissions: ['canApproveDocuments'],
      order: 4,
      isRequired: false,
      timeoutHours: 48
    },
    {
      id: 'cco_oversight',
      name: 'CCO Final Oversight (if escalated)',
      requiredRoles: ['cco'],
      requiredPermissions: ['canApproveDocuments'],
      order: 5,
      isRequired: false,
      timeoutHours: 72
    }
  ]

  // Bulk Processing Workflow
  private bulkProcessingWorkflow: WorkflowStep[] = [
    {
      id: 'bulk_upload',
      name: 'Bulk Document Upload',
      requiredRoles: ['compliance_manager', 'cco'],
      requiredPermissions: ['canBulkProcess'],
      order: 1,
      isRequired: true
    },
    {
      id: 'bulk_ai_processing',
      name: 'Bulk AI Processing',
      requiredRoles: ['system'],
      requiredPermissions: ['canProcessDocuments'],
      order: 2,
      isRequired: true
    },
    {
      id: 'bulk_review',
      name: 'Bulk Review & Validation',
      requiredRoles: ['compliance_manager', 'cco'],
      requiredPermissions: ['canApproveDocuments'],
      order: 3,
      isRequired: true,
      timeoutHours: 72
    },
    {
      id: 'bulk_approval',
      name: 'Final Bulk Approval',
      requiredRoles: ['cco'],
      requiredPermissions: ['canApproveDocuments'],
      order: 4,
      isRequired: true,
      timeoutHours: 24
    }
  ]

  // RAG Query Workflow
  private ragQueryWorkflow: WorkflowStep[] = [
    {
      id: 'rag_query',
      name: 'RAG Query Execution',
      requiredRoles: ['compliance_officer', 'compliance_manager', 'cco', 'ciso', 'internal_auditor', 'dpo', 'external_auditor'],
      requiredPermissions: ['canSearchDocuments'],
      order: 1,
      isRequired: true
    },
    {
      id: 'rag_audit',
      name: 'Query Audit Logging',
      requiredRoles: ['system'],
      requiredPermissions: [],
      order: 2,
      isRequired: true
    }
  ]

  async validateWorkflowAccess(
    user: User,
    workflowType: 'document_processing' | 'bulk_processing' | 'rag_query',
    stepId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const workflow = this.getWorkflow(workflowType)
    const step = workflow.find(s => s.id === stepId)

    if (!step) {
      return { allowed: false, reason: 'Invalid workflow step' }
    }

    const userPermissions = getUserPermissions(user.role_name)

    // Check role access
    if (!step.requiredRoles.includes(user.role_name)) {
      await this.logAccessDenial(user, workflowType, stepId, 'insufficient_role')
      return { allowed: false, reason: `Role ${user.role_name} not authorized for step ${stepId}` }
    }

    // Check permission access
    for (const permission of step.requiredPermissions) {
      if (!userPermissions[permission as keyof typeof userPermissions]) {
        await this.logAccessDenial(user, workflowType, stepId, 'insufficient_permissions')
        return { allowed: false, reason: `Missing permission: ${permission}` }
      }
    }

    await this.logAccessGrant(user, workflowType, stepId)
    return { allowed: true }
  }

  async executeWorkflowStep(
    user: User,
    workflowType: 'document_processing' | 'bulk_processing' | 'rag_query',
    stepId: string,
    documentId: string,
    actionData?: any
  ): Promise<{ success: boolean; nextStep?: WorkflowStep; error?: string }> {
    // Validate access first
    const accessCheck = await this.validateWorkflowAccess(user, workflowType, stepId)
    if (!accessCheck.allowed) {
      return { success: false, error: accessCheck.reason }
    }

    const workflow = this.getWorkflow(workflowType)
    const currentStep = workflow.find(s => s.id === stepId)

    if (!currentStep) {
      return { success: false, error: 'Invalid workflow step' }
    }

    // Execute the step based on type
    const result = await this.executeStepLogic(user, workflowType, currentStep, documentId, actionData)

    if (result.success) {
      // Determine next step
      const nextStep = result.decision ? this.getNextStep(workflow, currentStep, result.decision) : undefined

      await this.logStepExecution(user, workflowType, stepId, documentId, 'completed', result)

      return { success: true, nextStep }
    } else {
      await this.logStepExecution(user, workflowType, stepId, documentId, 'failed', result)
      return { success: false, error: result.error }
    }
  }

  private async executeStepLogic(
    user: User,
    workflowType: string,
    step: WorkflowStep,
    documentId: string,
    actionData?: any
  ): Promise<{ success: boolean; decision?: 'approved' | 'rejected' | 'escalated'; error?: string; data?: any }> {

    switch (step.id) {
      case 'ai_classification':
        // This would integrate with the AI Decision Engine
        return { success: true, decision: 'approved' } // Placeholder

      case 'officer_review':
        const officerDecision = actionData?.decision
        if (officerDecision === 'AGREE') {
          return { success: true, decision: 'approved' }
        } else {
          return { success: true, decision: 'escalated' }
        }

      case 'manager_approval':
        const managerDecision = actionData?.decision
        return { success: true, decision: managerDecision === 'APPROVE' ? 'approved' : 'rejected' }

      case 'cco_oversight':
        const ccoDecision = actionData?.decision
        return { success: true, decision: ccoDecision === 'APPROVE' ? 'approved' : 'rejected' }

      case 'rag_query':
        // RAG queries are always allowed if user has access
        return { success: true, decision: 'approved' }

      default:
        return { success: true, decision: 'approved' }
    }
  }

  private getNextStep(
    workflow: WorkflowStep[],
    currentStep: WorkflowStep,
    decision: 'approved' | 'rejected' | 'escalated'
  ): WorkflowStep | undefined {
    const currentIndex = workflow.findIndex(s => s.id === currentStep.id)

    if (decision === 'approved' && currentStep.isRequired) {
      // Move to next required step
      for (let i = currentIndex + 1; i < workflow.length; i++) {
        if (workflow[i].isRequired) {
          return workflow[i]
        }
      }
    } else if (decision === 'escalated') {
      // Find escalation path
      const escalationSteps = workflow.filter(s => !s.isRequired && s.order > currentStep.order)
      return escalationSteps[0]
    }

    return undefined // Workflow complete
  }

  private getWorkflow(type: 'document_processing' | 'bulk_processing' | 'rag_query'): WorkflowStep[] {
    switch (type) {
      case 'document_processing':
        return this.documentProcessingWorkflow
      case 'bulk_processing':
        return this.bulkProcessingWorkflow
      case 'rag_query':
        return this.ragQueryWorkflow
      default:
        return []
    }
  }

  async checkWorkflowTimeouts(documentId: string): Promise<WorkflowStep[]> {
    // This would check for timed-out workflow steps and escalate them
    // Implementation would query database for pending steps past their timeout
    return []
  }

  async getWorkflowStatus(documentId: string): Promise<WorkflowInstance | null> {
    // This would retrieve current workflow status from database
    return null
  }

  private async logAccessGrant(user: User, workflowType: string, stepId: string): Promise<void> {
    await auditLogger.log({
      user_id: user.user_id,
      role_name: user.role_name,
      action: 'WORKFLOW_ACCESS_GRANTED',
      resource_type: 'WORKFLOW_STEP',
      resource_id: `${workflowType}:${stepId}`,
      success: true,
      details: {
        workflow_type: workflowType,
        step_id: stepId,
        timestamp: new Date().toISOString()
      }
    })
  }

  private async logAccessDenial(user: User, workflowType: string, stepId: string, reason: string): Promise<void> {
    await auditLogger.log({
      user_id: user.user_id,
      role_name: user.role_name,
      action: 'WORKFLOW_ACCESS_DENIED',
      resource_type: 'WORKFLOW_STEP',
      resource_id: `${workflowType}:${stepId}`,
      success: false,
      details: {
        workflow_type: workflowType,
        step_id: stepId,
        reason,
        timestamp: new Date().toISOString()
      }
    })
  }

  private async logStepExecution(
    user: User,
    workflowType: string,
    stepId: string,
    documentId: string,
    status: 'completed' | 'failed',
    result: any
  ): Promise<void> {
    await auditLogger.log({
      user_id: user.user_id,
      role_name: user.role_name,
      action: 'WORKFLOW_STEP_EXECUTED',
      resource_type: 'DOCUMENT',
      resource_id: documentId,
      success: status === 'completed',
      details: {
        workflow_type: workflowType,
        step_id: stepId,
        execution_status: status,
        result,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Method to validate AI decision against workflow rules
  async validateAIDecision(
    user: User,
    documentId: string,
    aiDecision: AIDecision
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = []

    // Check if user has permission to make this type of decision
    const userPermissions = getUserPermissions(user.role_name)

    if (aiDecision.verdict === 'APPROVED' && !userPermissions.canApproveDocuments) {
      violations.push('User lacks approval permissions for AI decision')
    }

    if (aiDecision.verdict === 'REJECTED' && !userPermissions.canRejectDocuments) {
      violations.push('User lacks rejection permissions for AI decision')
    }

    // Check bias thresholds
    if (aiDecision.bias_analysis.bias_score > 0.8) {
      violations.push('High bias score requires manual review')
    }

    // Check confidence thresholds
    if (aiDecision.confidence < 0.6) {
      violations.push('Low confidence requires escalation')
    }

    return {
      valid: violations.length === 0,
      violations
    }
  }
}

export const rbacWorkflowService = RBACWorkflowService.getInstance()