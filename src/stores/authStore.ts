import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/services/auth.service'
import { authService } from '@/services/auth.service'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await authService.signIn(email, password)

          if (result.error) {
            set({ error: result.error, isLoading: false })
            return
          }

          set({
            user: result.session!.user,
            token: result.session!.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          })
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null })
        try {
          await authService.signOut()
          // Clear local storage and redirect to login
          localStorage.removeItem('nova-grc-auth')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
          })
          // Force page reload to clear all state and redirect
          window.location.href = '/login'
        } catch (error) {
          console.error('Sign out error:', error)
          // Even if sign out fails, clear state and redirect
          localStorage.removeItem('nova-grc-auth')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
          })
          window.location.href = '/login'
        }
      },

      checkSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error || !session) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
            return
          }

          const { data: userData } = await supabase
            .from('users')
            .select(`
              *,
              roles (role_name, can_approve, data_scope)
            `)
            .eq('user_id', session.user.id)
            .maybeSingle()

          if (userData) {
            const user: User = {
              user_id: userData.user_id,
              email: userData.email,
              full_name: userData.full_name,
              role_id: userData.role_id,
              role_name: (userData.roles as any).role_name,
              team_id: userData.team_id,
              mfa_enabled: userData.mfa_enabled,
              is_active: userData.is_active,
            }

            set({
              user,
              token: session.access_token,
              isAuthenticated: true,
            })
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        }
      },
    }),
    {
      name: 'nova-grc-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
