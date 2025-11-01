import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Navigation } from '@/components/Navigation'
import { rbacComplianceService } from '@/services/rbac-compliance.service'
import type { DPDPComplianceReport, ComplianceViolation } from '@/services/rbac-compliance.service'

export function ComplianceDashboard() {
  const { user } = useAuthStore()
  const [complianceReport, setComplianceReport] = useState<DPDPComplianceReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null)

  const isDPO = user?.role_name === 'dpo'

  useEffect(() => {
    loadComplianceReport()
  }, [])

  const loadComplianceReport = async () => {
    try {
      setLoading(true)
      const report = await rbacComplianceService.checkDPDPCompliance()
      setComplianceReport(report)
    } catch (error) {
      console.error('Error loading compliance report:', error)
    } finally {
      setLoading(false)
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-700 bg-red-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'medium': return 'text-yellow-700 bg-yellow-100'
      case 'low': return 'text-blue-700 bg-blue-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getViolationTypeIcon = (type: string) => {
    switch (type) {
      case 'ACCESS_DENIED': return '🚫'
      case 'PERMISSION_MISMATCH': return '⚠️'
      case 'WORKFLOW_VIOLATION': return '🔄'
      case 'DATA_ACCESS_VIOLATION': return '🔒'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compliance dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
        </div>

        {complianceReport && (
          <div className="space-y-6">
            {/* Overall Compliance Score */}
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isDPO ? 'Data Protection Compliance Score' : 'Overall Compliance Score'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Last audit: {complianceReport.lastAudit.toLocaleString()}
                  </p>
                </div>
                <div className={`px-6 py-3 rounded-xl text-3xl font-bold shadow-lg ${getComplianceColor(complianceReport.overallCompliance)}`}>
                  {complianceReport.overallCompliance}%
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-3">
                  <span>{isDPO ? 'Privacy Compliance Level' : 'Compliance Level'}</span>
                  <span>{complianceReport.overallCompliance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      complianceReport.overallCompliance >= 90 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                      complianceReport.overallCompliance >= 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${complianceReport.overallCompliance}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Data Protection Section for DPO */}
            {isDPO && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-blue-900">Data Protection</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      As Data Protection Officer, you have oversight of all privacy-related compliance measures,
                      including GDPR adherence, data minimization, consent management, and cross-border transfer controls.
                    </p>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-blue-700">
                        <strong>Key Responsibilities:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                        <li>Monitor data processing activities for GDPR compliance</li>
                        <li>Ensure proper consent mechanisms are in place</li>
                        <li>Oversee data retention and deletion policies</li>
                        <li>Manage data subject access requests</li>
                        <li>Conduct privacy impact assessments</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Violations */}
              <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Compliance Violations</h3>
                        <p className="text-sm text-gray-600">{complianceReport.violations.length} violations detected</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {complianceReport.violations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl">✅</div>
                      <p className="mt-2 text-sm font-medium text-gray-900">No violations detected</p>
                      <p className="text-sm text-gray-500">All systems compliant</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {complianceReport.violations.map((violation) => (
                        <div
                          key={violation.id}
                          onClick={() => setSelectedViolation(violation)}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedViolation?.id === violation.id
                              ? 'bg-blue-50 border-l-4 border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">{getViolationTypeIcon(violation.violationType)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {violation.violationType.replace('_', ' ')}
                                </p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(violation.severity)}`}>
                                  {violation.severity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {violation.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {violation.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Access Control Matrix */}
              <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Access Control Matrix</h3>
                        <p className="text-sm text-gray-600">Role-based permissions overview</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {complianceReport.accessMatrix.map((matrix) => (
                      <div key={matrix.role} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 capitalize">
                            {matrix.role.replace('_', ' ')}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              matrix.dataScope === 'ALL' ? 'bg-red-100 text-red-800' :
                              matrix.dataScope === 'TEAM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {matrix.dataScope} Scope
                            </span>
                            {matrix.auditRequired && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                Audited
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {matrix.restrictions.slice(0, 2).map((restriction, index) => (
                            <p key={index}>• {restriction}</p>
                          ))}
                          {matrix.restrictions.length > 2 && (
                            <p className="text-blue-600">+{matrix.restrictions.length - 2} more restrictions</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Compliance Recommendations</h3>
              </div>
              {complianceReport.recommendations.length === 0 ? (
                <p className="text-gray-600">No recommendations at this time.</p>
              ) : (
                <div className="space-y-3">
                  {complianceReport.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="text-blue-600 mt-0.5">💡</span>
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Audit Due */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">Next Audit Due</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    <strong className="text-blue-900">{complianceReport.nextAuditDue.toLocaleDateString()}</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    Regular compliance audits ensure ongoing adherence to DPDP and RBAC requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Violation Details Modal */}
        {selectedViolation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Violation Details</h3>
                <button
                  onClick={() => setSelectedViolation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Violation Type</label>
                    <p className="text-sm text-gray-900">{selectedViolation.violationType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Severity</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(selectedViolation.severity)}`}>
                      {selectedViolation.severity}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="text-sm text-gray-900">{selectedViolation.userId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="text-sm text-gray-900">{selectedViolation.roleName}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Resource</label>
                  <p className="text-sm text-gray-900">{selectedViolation.resource}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedViolation.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Remediation</label>
                  <p className="text-sm text-gray-900">{selectedViolation.remediation}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    selectedViolation.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                    selectedViolation.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedViolation.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{selectedViolation.timestamp.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}