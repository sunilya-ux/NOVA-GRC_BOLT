import type { RoleName } from './database.types'

interface RoutePermissions {
  path: string
  label: string
  allowedRoles: RoleName[]
}

export const routePermissions: RoutePermissions[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    allowedRoles: [
      'compliance_officer',
      'compliance_manager',
      'cco',
      'ciso',
      'system_admin',
      'ml_engineer',
      'internal_auditor',
      'dpo',
      'external_auditor'
    ]
  },
  {
    path: '/upload',
    label: 'Upload',
    allowedRoles: ['compliance_officer', 'compliance_manager']
  },
  {
    path: '/processing',
    label: 'Processing',
    allowedRoles: ['compliance_officer', 'compliance_manager', 'cco', 'internal_auditor']
  },
  {
    path: '/review',
    label: 'Review',
    allowedRoles: ['compliance_officer', 'compliance_manager', 'cco', 'internal_auditor']
  },
  {
    path: '/search',
    label: 'Search',
    allowedRoles: [
      'compliance_officer',
      'compliance_manager',
      'cco',
      'ciso',
      'internal_auditor',
      'dpo',
      'external_auditor'
    ]
  },
  {
    path: '/analytics',
    label: 'Analytics',
    allowedRoles: ['compliance_manager', 'cco', 'ciso', 'internal_auditor', 'dpo', 'external_auditor']
  },
  {
    path: '/bulk',
    label: 'Bulk',
    allowedRoles: ['compliance_manager', 'cco']
  }
]

export function hasRouteAccess(userRole: RoleName, path: string): boolean {
  const route = routePermissions.find(r => r.path === path)
  if (!route) return false
  return route.allowedRoles.includes(userRole)
}

export function getAccessibleRoutes(userRole: RoleName): RoutePermissions[] {
  return routePermissions.filter(route => route.allowedRoles.includes(userRole))
}
