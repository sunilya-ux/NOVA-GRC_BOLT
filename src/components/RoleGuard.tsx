import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { auditLogger } from '@/services/audit.service'
import type { RoleName } from '@/lib/database.types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: RoleName[]
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role_name)) {
    // Log unauthorized access attempt
    auditLogger.log({
      user_id: user.user_id,
      role_name: user.role_name,
      action: 'ACCESS_DENIED',
      resource_type: 'PAGE',
      resource_id: window.location.pathname,
      success: false,
      details: {
        requiredRoles: allowedRoles,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    }).catch(console.error)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-600 mb-4">
              You do not have the required permissions to access this page.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Your role:</strong> {user.role_name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Required roles:</strong> {allowedRoles.join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 mb-2"
          >
            Go Back
          </button>
          <a
            href={redirectTo}
            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
