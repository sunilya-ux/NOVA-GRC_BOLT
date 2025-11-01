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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <div className="text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl">
              <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="mt-8 text-4xl font-extrabold text-gray-900">Welcome to NOVA-GRC</h1>
            <p className="mt-3 text-lg text-gray-600">AI-First Banking Compliance Platform</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm py-10 px-8 shadow-2xl rounded-2xl border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="officer@bank.com"
                  aria-describedby="email-description"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  aria-describedby="password-description"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4" role="alert" id="error-message">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
                className="w-full flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105"
                aria-describedby={error ? "error-message" : undefined}
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

            <div className="mt-6 space-y-4">
              <p className="text-sm font-medium text-gray-700 text-center" id="demo-description">Click any role to auto-fill credentials (Password: demo123)</p>
              <div className="grid grid-cols-2 gap-3 text-xs" role="group" aria-labelledby="demo-description">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => handleRoleClick(user.email)}
                    className={`${user.bgClass} p-4 rounded-lg text-left transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-opacity-100 hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    aria-label={`Login as ${user.role} with email ${user.email}`}
                  >
                    <strong className={user.textClass}>{user.role}</strong>
                    <p className={user.emailClass}>{user.email}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2" aria-live="polite">
                + 2 more users for testing team segregation (officer2@demo.com, manager2@demo.com)
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p className="font-medium">Protected by Role-Based Access Control (RBAC)</p>
          <p className="mt-2">Sprint 1 - Foundation Implementation</p>
        </div>
      </div>
    </div>
  )
}
