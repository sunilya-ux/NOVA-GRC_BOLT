import { supabase } from '../lib/supabase'
import type { RoleName } from '../lib/database.types'

interface AuditLogEntry {
  user_id?: string | null
  role_name?: RoleName | null
  action: string
  resource_type?: string
  resource_id?: string
  module_name?: string
  status_code?: number
  success: boolean
  ip_address?: string
  user_agent?: string
  request_method?: string
  request_path?: string
  response_time?: number
  details?: Record<string, any>
}

class AuditLogger {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        user_id: entry.user_id || null,
        role_name: entry.role_name || null,
        action: entry.action,
        resource_type: entry.resource_type || null,
        resource_id: entry.resource_id || null,
        module_name: entry.module_name || null,
        status_code: entry.status_code || 200,
        success: entry.success,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || navigator.userAgent,
        request_method: entry.request_method || null,
        request_path: entry.request_path || window.location.pathname,
        response_time: entry.response_time || null,
        details: entry.details || null,
      })
    } catch (error) {
      console.error('Failed to log audit entry:', error)
    }
  }
}

export const auditLogger = new AuditLogger()
