import { supabase } from '@/lib/supabase'
import type { RoleName } from '@/lib/database.types'
import { auditLogger } from './audit.service'

export interface User {
  user_id: string
  email: string
  full_name: string
  role_id: number
  role_name: RoleName
  team_id: string | null
  mfa_enabled: boolean
  is_active: boolean
}

export interface AuthSession {
  user: User
  token: string
  expires_at: string
}

class AuthService {
  private currentUser: User | null = null

  async signUp(params: {
    email: string
    password: string
    full_name: string
    role_name: RoleName
    team_id?: string
  }): Promise<{ user: User; error: null } | { user: null; error: string }> {
    try {
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('role_id')
        .eq('role_name', params.role_name)
        .maybeSingle()

      if (roleError || !role) {
        return { user: null, error: 'Invalid role' }
      }

      const passwordHash = await this.hashPassword(params.password)

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: params.email,
          password_hash: passwordHash,
          full_name: params.full_name,
          role_id: role.role_id,
          team_id: params.team_id || null,
          mfa_enabled: false,
          is_active: true,
        })
        .select()
        .single()

      if (userError) {
        return { user: null, error: userError.message }
      }

      await auditLogger.log({
        user_id: user.user_id,
        role_name: params.role_name,
        action: 'USER_SIGNUP',
        resource_type: 'user',
        resource_id: user.user_id,
        success: true,
        details: { email: params.email },
      })

      return {
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role_id: user.role_id,
          role_name: params.role_name,
          team_id: user.team_id,
          mfa_enabled: user.mfa_enabled,
          is_active: user.is_active,
        },
        error: null,
      }
    } catch (error) {
      return { user: null, error: (error as Error).message }
    }
  }

  async signIn(email: string, password: string): Promise<{ session: AuthSession; error: null } | { session: null; error: string }> {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError || !authData.user) {
        await auditLogger.log({
          user_id: null,
          role_name: null,
          action: 'LOGIN_FAILED',
          success: false,
          details: { email, reason: authError?.message || 'Authentication failed' },
        })
        return { session: null, error: 'Invalid credentials' }
      }

      // Fetch user details from public.users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          roles (role_name, can_approve, data_scope)
        `)
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (userError || !user) {
        await auditLogger.log({
          user_id: authData.user.id,
          role_name: null,
          action: 'LOGIN_FAILED',
          success: false,
          details: { email, reason: 'User not found or inactive' },
        })
        return { session: null, error: 'User account not found' }
      }

      const token = authData.session?.access_token || this.generateToken()
      const expiresAt = authData.session?.expires_at
        ? new Date(authData.session.expires_at * 1000).toISOString()
        : new Date(Date.now() + 30 * 60 * 1000).toISOString()

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', user.user_id)

      await auditLogger.log({
        user_id: user.user_id,
        role_name: (user.roles as any).role_name,
        action: 'LOGIN_SUCCESS',
        resource_type: 'session',
        success: true,
        details: { email },
      })

      const authUser: User = {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
        role_name: (user.roles as any).role_name,
        team_id: user.team_id,
        mfa_enabled: user.mfa_enabled,
        is_active: user.is_active,
      }

      this.currentUser = authUser

      return {
        session: {
          user: authUser,
          token,
          expires_at: expiresAt,
        },
        error: null,
      }
    } catch (error) {
      return { session: null, error: (error as Error).message }
    }
  }

  async signOut(): Promise<void> {
    if (this.currentUser) {
      await auditLogger.log({
        user_id: this.currentUser.user_id,
        role_name: this.currentUser.role_name,
        action: 'LOGOUT',
        success: true,
      })
    }
    await supabase.auth.signOut()
    this.currentUser = null
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  async verifySession(token: string): Promise<User | null> {
    try {
      const tokenHash = await this.hashPassword(token)

      const { data: session } = await supabase
        .from('user_sessions')
        .select(`
          *,
          users (
            *,
            roles (role_name, can_approve, data_scope)
          )
        `)
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (!session) {
        return null
      }

      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_id', session.session_id)

      const user = (session.users as any)
      this.currentUser = {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
        role_name: user.roles.role_name,
        team_id: user.team_id,
        mfa_enabled: user.mfa_enabled,
        is_active: user.is_active,
      }

      return this.currentUser
    } catch (error) {
      return null
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  private generateToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

export const authService = new AuthService()
