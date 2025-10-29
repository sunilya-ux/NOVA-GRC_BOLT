import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const demoUsers = [
  {
    role: 'Compliance Officer',
    email: 'officer@demo.com',
    bgClass: 'bg-blue-50 hover:bg-blue-100 border-blue-300',
    textClass: 'text-blue-900',
    emailClass: 'text-blue-700'
  },
  {
    role: 'Compliance Manager',
    email: 'manager@demo.com',
    bgClass: 'bg-green-50 hover:bg-green-100 border-green-300',
    textClass: 'text-green-900',
    emailClass: 'text-green-700'
  },
  {
    role: 'CCO',
    email: 'cco@demo.com',
    bgClass: 'bg-purple-50 hover:bg-purple-100 border-purple-300',
    textClass: 'text-purple-900',
    emailClass: 'text-purple-700'
  },
  {
    role: 'System Admin',
    email: 'admin@demo.com',
    bgClass: 'bg-gray-50 hover:bg-gray-100 border-gray-300',
    textClass: 'text-gray-900',
    emailClass: 'text-gray-700'
  },
  {
    role: 'ML Engineer',
    email: 'mlengineer@demo.com',
    bgClass: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300',
    textClass: 'text-yellow-900',
    emailClass: 'text-yellow-700'
  },
  {
    role: 'CISO',
    email: 'ciso@demo.com',
    bgClass: 'bg-red-50 hover:bg-red-100 border-red-300',
    textClass: 'text-red-900',
    emailClass: 'text-red-700'
  },
  {
    role: 'Internal Auditor',
    email: 'auditor@demo.com',
    bgClass: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300',
    textClass: 'text-indigo-900',
    emailClass: 'text-indigo-700'
  },
  {
    role: 'DPO',
    email: 'dpo@demo.com',
    bgClass: 'bg-pink-50 hover:bg-pink-100 border-pink-300',
    textClass: 'text-pink-900',
    emailClass: 'text-pink-700'
  },
  {
    role: 'External Auditor',
    email: 'external@demo.com',
    bgClass: 'bg-orange-50 hover:bg-orange-100 border-orange-300',
    textClass: 'text-orange-900',
    emailClass: 'text-orange-700'
  },
]

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, isLoading, error, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/dashboard')
    }
  }

  const handleRoleClick = (email: string) => {
    setEmail(email)
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-600">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-900">NOVA-GRC</h2>
            <p className="mt-2 text-sm text-gray-600">AI-First Banking Compliance Platform</p>
          </div>
        </div>
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="officer@bank.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium text-gray-700">Click any role to auto-fill credentials (Password: demo123):</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => handleRoleClick(user.email)}
                    className={`${user.bgClass} p-2 rounded text-left transition-colors cursor-pointer border-2 border-transparent hover:border-opacity-100`}
                  >
                    <strong className={user.textClass}>{user.role}</strong>
                    <p className={user.emailClass}>{user.email}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                + 2 more users for testing team segregation (officer2@demo.com, manager2@demo.com)
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Protected by Role-Based Access Control (RBAC)</p>
          <p className="mt-1">Sprint 1 - Foundation Implementation</p>
        </div>
      </div>
    </div>
  )
}
