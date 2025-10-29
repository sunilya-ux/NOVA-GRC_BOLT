import type { RoleName } from '@/lib/database.types'

interface RoleBadgeProps {
  role: RoleName
  className?: string
}

const roleColors: Record<RoleName, string> = {
  compliance_officer: 'bg-blue-100 text-blue-800 border-blue-300',
  compliance_manager: 'bg-green-100 text-green-800 border-green-300',
  cco: 'bg-purple-100 text-purple-800 border-purple-300',
  ciso: 'bg-red-100 text-red-800 border-red-300',
  system_admin: 'bg-gray-100 text-gray-800 border-gray-300',
  ml_engineer: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  internal_auditor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  dpo: 'bg-pink-100 text-pink-800 border-pink-300',
  external_auditor: 'bg-orange-100 text-orange-800 border-orange-300',
}

const roleLabels: Record<RoleName, string> = {
  compliance_officer: 'Compliance Officer',
  compliance_manager: 'Compliance Manager',
  cco: 'CCO',
  ciso: 'CISO',
  system_admin: 'System Admin',
  ml_engineer: 'ML Engineer',
  internal_auditor: 'Internal Auditor',
  dpo: 'DPO',
  external_auditor: 'External Auditor',
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleColors[role]} ${className}`}
    >
      {roleLabels[role]}
    </span>
  )
}
