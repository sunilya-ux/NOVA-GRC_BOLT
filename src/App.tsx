import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { DashboardEnhanced } from './pages/DashboardEnhanced'
import { DocumentProcessing } from './pages/DocumentProcessing'
import { DocumentUpload } from './pages/DocumentUpload'
import { DocumentReview } from './pages/DocumentReview'
import { ManagerApproval } from './pages/ManagerApproval'
import { DocumentSearch } from './pages/DocumentSearch'
import { Analytics } from './pages/Analytics'
import { BulkProcessing } from './pages/BulkProcessing'
import { AuditLogs } from './pages/AuditLogs'
import { AIExplainability } from './pages/AIExplainability'
import { ComplianceDashboard } from './pages/ComplianceDashboard'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleGuard } from './components/RoleGuard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthStore } from './stores/authStore'

function App() {
  const { checkSession } = useAuthStore()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardEnhanced />
              </ProtectedRoute>
            }
          />
          <Route
            path="/processing"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_officer', 'compliance_manager', 'cco', 'ciso', 'external_auditor']}>
                  <DocumentProcessing />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_officer', 'compliance_manager']}>
                  <DocumentUpload />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/review"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_officer', 'compliance_manager', 'cco']}>
                  <DocumentReview />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_officer', 'compliance_manager', 'cco', 'ciso', 'internal_auditor', 'dpo', 'external_auditor']}>
                  <DocumentSearch />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_manager', 'cco']}>
                  <ManagerApproval />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_officer', 'compliance_manager', 'cco', 'ciso', 'internal_auditor', 'dpo', 'external_auditor']}>
                  <Analytics />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_manager', 'cco']}>
                  <BulkProcessing />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-explainability"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['compliance_officer', 'compliance_manager', 'cco', 'ciso', 'internal_auditor', 'dpo', 'external_auditor']}>
                  <AIExplainability />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance-dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['cco', 'ciso', 'internal_auditor', 'dpo', 'external_auditor']}>
                  <ComplianceDashboard />
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
