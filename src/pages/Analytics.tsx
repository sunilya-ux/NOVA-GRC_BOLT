import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  documentsByType: Array<{ document_type: string; count: number }>
  documentsByStatus: Array<{ status: string; count: number }>
  aiAccuracy: {
    total: number
    agreed: number
    disagreed: number
    accuracy: number
  }
  processingTrends: Array<{ date: string; count: number }>
  topUsers: Array<{ email: string; document_count: number }>
}

export function Analytics() {
  const { user } = useAuthStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [user, timeRange])

  const loadAnalytics = async () => {
    if (!user) return

    try {
      setLoading(true)

      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - daysAgo)

      const [
        { data: byType },
        { data: byStatus },
        { data: decisions },
        { data: trends },
        { data: topUsers }
      ] = await Promise.all([
        supabase
          .from('documents')
          .select('document_type')
          .gte('created_at', dateFilter.toISOString()),
        supabase
          .from('documents')
          .select('status')
          .gte('created_at', dateFilter.toISOString()),
        supabase
          .from('decisions')
          .select('officer_action, status')
          .gte('ai_timestamp', dateFilter.toISOString()),
        supabase
          .from('documents')
          .select('created_at')
          .gte('created_at', dateFilter.toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('documents')
          .select('uploaded_by, users!inner(email)')
          .gte('created_at', dateFilter.toISOString())
      ])

      const documentsByType = Object.entries(
        (byType || []).reduce((acc: any, doc) => {
          acc[doc.document_type] = (acc[doc.document_type] || 0) + 1
          return acc
        }, {})
      ).map(([document_type, count]) => ({ document_type, count: count as number }))

      const documentsByStatus = Object.entries(
        (byStatus || []).reduce((acc: any, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1
          return acc
        }, {})
      ).map(([status, count]) => ({ status, count: count as number }))

      const totalDecisions = decisions?.length || 0
      const agreedCount = decisions?.filter(d => d.officer_action === 'AGREE').length || 0
      const disagreedCount = decisions?.filter(d => d.officer_action === 'DISAGREE').length || 0

      const processingTrends = (trends || []).reduce((acc: any, doc) => {
        const date = new Date(doc.created_at).toLocaleDateString()
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      const processingTrendsArray = Object.entries(processingTrends).map(([date, count]) => ({
        date,
        count: count as number
      }))

      const userCounts = (topUsers || []).reduce((acc: any, doc: any) => {
        const email = doc.users?.email || 'Unknown'
        acc[email] = (acc[email] || 0) + 1
        return acc
      }, {})

      const topUsersArray = Object.entries(userCounts)
        .map(([email, document_count]) => ({ email, document_count: document_count as number }))
        .sort((a, b) => b.document_count - a.document_count)
        .slice(0, 5)

      setData({
        documentsByType,
        documentsByStatus,
        aiAccuracy: {
          total: totalDecisions,
          agreed: agreedCount,
          disagreed: disagreedCount,
          accuracy: totalDecisions > 0 ? (agreedCount / totalDecisions) * 100 : 0
        },
        processingTrends: processingTrendsArray,
        topUsers: topUsersArray
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.documentsByStatus.reduce((sum, s) => sum + s.count, 0) || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Accuracy</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.aiAccuracy.accuracy.toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.documentsByStatus.find(s => s.status === 'approved')?.count || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data?.documentsByStatus.find(s => s.status === 'rejected')?.count || 0}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Type</h3>
            <div className="space-y-4">
              {data?.documentsByType.map((item) => {
                const total = data.documentsByType.reduce((sum, s) => sum + s.count, 0)
                const percentage = ((item.count / total) * 100).toFixed(1)
                return (
                  <div key={item.document_type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.document_type}</span>
                      <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Status</h3>
            <div className="space-y-4">
              {data?.documentsByStatus.map((item) => {
                const total = data.documentsByStatus.reduce((sum, s) => sum + s.count, 0)
                const percentage = ((item.count / total) * 100).toFixed(1)
                const colors: Record<string, string> = {
                  approved: 'bg-green-600',
                  rejected: 'bg-red-600',
                  classified: 'bg-blue-600',
                  pending: 'bg-yellow-600',
                  processing: 'bg-orange-600'
                }
                return (
                  <div key={item.status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item.status}</span>
                      <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[item.status] || 'bg-gray-600'} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Decision Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Total AI Decisions</span>
                <span className="text-lg font-bold text-gray-900">{data?.aiAccuracy.total || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-sm font-medium text-gray-700">Officer Agreed</span>
                <span className="text-lg font-bold text-green-700">{data?.aiAccuracy.agreed || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="text-sm font-medium text-gray-700">Officer Disagreed</span>
                <span className="text-lg font-bold text-red-700">{data?.aiAccuracy.disagreed || 0}</span>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">Accuracy Rate</p>
                <div className="flex items-end space-x-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {data?.aiAccuracy.accuracy.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-600 mb-2">
                    AI agreement rate
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
            <div className="space-y-3">
              {data?.topUsers.map((item, index) => (
                <div key={item.email} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-400' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.email}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{item.document_count}</span>
                </div>
              ))}
              {(!data?.topUsers || data.topUsers.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
