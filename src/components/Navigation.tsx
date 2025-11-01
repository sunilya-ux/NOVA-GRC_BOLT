import { useAuthStore } from '@/stores/authStore'
import { useLocation, Link } from 'react-router-dom'
import { getAccessibleRoutes } from '@/lib/permissions'
import {
  LayoutDashboard,
  FileText,
  Upload,
  Search,
  Clock,
  Shield,
  BarChart3,
  Users,
  LogOut,
  User
} from 'lucide-react'

const routeIcons: Record<string, any> = {
  '/dashboard': LayoutDashboard,
  '/upload': Upload,
  '/processing': Clock,
  '/review': FileText,
  '/manager-approvals': Shield,
  '/search': Search,
  '/analytics': BarChart3,
  '/bulk': FileText,
  '/ai-explainability': BarChart3,
  '/compliance': Shield
}

export function Navigation() {
  const { user, signOut, isLoading } = useAuthStore()
  const location = useLocation()

  if (!user) return null

  const accessibleRoutes = getAccessibleRoutes(user.role_name)

  const mainRoutes = accessibleRoutes.filter(r =>
    ['/dashboard', '/upload', '/search', '/processing', '/compliance', '/analytics', '/review'].includes(r.path)
  )

  const quickActions = [
    { label: 'Upload Document', path: '/upload', icon: Upload },
    { label: 'Search Documents', path: '/search', icon: Search }
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">NOVA-GRC</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainRoutes.map((item) => {
          const Icon = routeIcons[item.path] || FileText
          const isActive = location.pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role_name}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            disabled={isLoading}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
