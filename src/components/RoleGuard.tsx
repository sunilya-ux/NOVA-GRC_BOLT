import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            You do not have permission to access this page. Your role ({user.role_name}) does not have the required permissions.
          </p>
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
