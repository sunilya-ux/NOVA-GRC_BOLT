import { useAuthStore } from '@/stores/authStore'
import { useLocation, Link } from 'react-router-dom'
import { getAccessibleRoutes } from '@/lib/permissions'
import { RoleBadge } from './RoleBadge'

// Define standard navigation order for consistent left-aligned tab layout across all roles
const STANDARD_NAV_ORDER = [
  'Main Dashboard',
  'Upload',
  'Processing',
  'Review',
  'Approvals',
  'Search',
  'Analytics',
  'Bulk',
  'My Activity',
  'AI Explainability',
  'Compliance Dashboard'
]

export function Navigation() {
  const { user, signOut, isLoading } = useAuthStore()
  const location = useLocation()

  if (!user) return null

  const accessibleRoutes = getAccessibleRoutes(user.role_name)

  // Sort navigation items according to standard order for consistent alignment
  const navItems = accessibleRoutes.sort((a, b) => {
    const aIndex = STANDARD_NAV_ORDER.indexOf(a.label)
    const bIndex = STANDARD_NAV_ORDER.indexOf(b.label)
    return aIndex - bIndex
  })

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8 flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">NOVA-GRC</h1>
                <p className="text-xs text-blue-100">AI-First Banking Compliance</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-1 flex-1 justify-start" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 ${
                    location.pathname === item.path
                      ? 'text-white bg-white/20 shadow-lg'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white">{user.full_name}</p>
              <p className="text-xs text-blue-100">{user.email}</p>
            </div>
            <RoleBadge role={user.role_name} />
            <button
              onClick={() => {
                console.log('Sign out button clicked')
                signOut()
              }}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sign out of your account"
            >
              {isLoading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        <div className="md:hidden border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-700/50 backdrop-blur-sm" role="navigation" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 ${
                  location.pathname === item.path
                    ? 'text-white bg-white/20'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
