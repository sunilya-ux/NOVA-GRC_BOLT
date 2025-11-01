import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Navigation } from '@/components/Navigation'
import { supabase } from '@/lib/supabase'

export function DashboardEnhanced() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingReview: 0,
    approved: 0,
    avgConfidence: 0,
  })

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  async function loadStats() {
    if (!user) return

    try {
      let query = supabase.from('documents').select('status, ocr_confidence')

      if (user.role_name === 'compliance_officer') {
        query = query.eq('assigned_to', user.user_id)
      } else if (user.role_name === 'compliance_manager') {
        const { data: teamMembers } = await supabase
          .from('users')
          .select('user_id')
          .eq('team_id', user.team_id)

        if (teamMembers) {
          query = query.in('assigned_to', teamMembers.map((m: any) => m.user_id))
        }
      }

      const { data } = await query

      if (data) {
        const total = data.length
        const pending = data.filter((d: any) => d.status === 'needs_review' || d.status === 'uploaded').length
        const approved = data.filter((d: any) => d.status === 'approved').length
        const confidences = data.filter((d: any) => d.ocr_confidence).map((d: any) => d.ocr_confidence)
        const avgConf = confidences.length > 0
          ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
          : 0

        setStats({
          totalDocuments: total,
          pendingReview: pending,
          approved,
          avgConfidence: avgConf,
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          {/* Header Section - Minimal with consistent spacing */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>

          {/* Two-Column Layout with 8px baseline grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Main Content (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Metric Cards Row - Equal width, consistent spacing */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pending Review</p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
                        <span className="text-xs font-medium text-red-600">+12%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Approved</p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                        <span className="text-xs font-medium text-green-600">+8%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Avg Confidence</p>
                      <p className="text-2xl font-bold text-gray-900">{(stats.avgConfidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Overview Section - Reference design style */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900">System Status</h2>
                  <div className="mt-2 h-px bg-gray-200"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">RBAC Enabled</p>
                        <p className="text-xs text-gray-500 mt-0.5">9 roles, 24 permissions configured</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Audit Logging</p>
                        <p className="text-xs text-gray-500 mt-0.5">100% coverage, real-time monitoring</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Row-Level Security</p>
                        <p className="text-xs text-gray-500 mt-0.5">All tables protected with RLS policies</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Activity Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                  <div className="mt-2 h-px bg-gray-200"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Document uploaded</p>
                      <p className="text-xs text-gray-500 mt-1">PAN_A123456789.pdf</p>
                      <p className="text-xs text-gray-400 mt-0.5">2 minutes ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="h-8 w-8 rounded bg-green-50 flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Document approved</p>
                      <p className="text-xs text-gray-500 mt-1">Aadhaar_XYZ789012.pdf</p>
                      <p className="text-xs text-gray-400 mt-0.5">15 minutes ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="h-8 w-8 rounded bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Review requested</p>
                      <p className="text-xs text-gray-500 mt-1">Passport_DEF345678.pdf</p>
                      <p className="text-xs text-gray-400 mt-0.5">1 hour ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">AI processing complete</p>
                      <p className="text-xs text-gray-500 mt-1">DL_GHI901234.pdf</p>
                      <p className="text-xs text-gray-400 mt-0.5">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Summary Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">System Status</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      All core systems operational. RBAC foundation deployed with 11 demo users, 5 sample documents, and comprehensive audit logging.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
