/*
  # Fix Security Issues - Part 3: Enable RLS and Add Policies

  ## Changes Made
  
  ### 1. Enable RLS on Public Tables
    - `roles` - Enable RLS with read-only policies
    - `role_permissions` - Enable RLS with appropriate policies
    - `permissions` - Enable RLS with read-only policies
    - `user_sessions` - Enable RLS with user-specific policies
  
  ### 2. Add RLS Policies for Tables Without Policies
    - `decisions` - Add role-based policies
    - `rbac_violations` - Add admin/auditor policies
  
  ### 3. Fix Function Search Paths
    - Update `update_updated_at_column` function
    - Update `clean_expired_sessions` function
  
  ## Security Impact
    - All public tables now have RLS enabled
    - Proper access control for all tables
    - Protected against privilege escalation
*/

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Roles are read-only for all authenticated users
CREATE POLICY "Authenticated users can view roles" ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system admins can modify roles
CREATE POLICY "System admins can manage roles" ON public.roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

-- Enable RLS on permissions table
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Permissions are read-only for all authenticated users
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system admins can modify permissions
CREATE POLICY "System admins can manage permissions" ON public.permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

-- Enable RLS on role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Role permissions are read-only for all authenticated users
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system admins can modify role permissions
CREATE POLICY "System admins can manage role permissions" ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

-- Enable RLS on user_sessions table
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" ON public.user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- System admins can view all sessions
CREATE POLICY "System admins can view all sessions" ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

-- Add policies for decisions table
CREATE POLICY "Officers can view own decisions" ON public.decisions
  FOR SELECT
  TO authenticated
  USING (
    officer_user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'compliance_officer'
    )
  );

CREATE POLICY "Managers can view team decisions" ON public.decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.roles r1 ON u1.role_id = r1.role_id
      WHERE u1.user_id = (select auth.uid())
      AND r1.role_name = 'compliance_manager'
      AND (
        manager_user_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM public.users u2
          WHERE u2.user_id = decisions.officer_user_id
          AND u2.team_id = u1.team_id
        )
      )
    )
  );

CREATE POLICY "Executives can view all decisions" ON public.decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name IN ('cco', 'ciso', 'internal_auditor', 'external_auditor')
    )
  );

CREATE POLICY "Officers can create decisions" ON public.decisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    officer_user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'compliance_officer'
    )
  );

CREATE POLICY "Managers can update decisions" ON public.decisions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'compliance_manager'
    )
  );

-- Add policies for rbac_violations table
CREATE POLICY "System admins can view violations" ON public.rbac_violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name IN ('system_admin', 'ciso', 'internal_auditor')
    )
  );

CREATE POLICY "System admins can create violations" ON public.rbac_violations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

CREATE POLICY "System admins can update violations" ON public.rbac_violations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles r ON users.role_id = r.role_id
      WHERE users.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

-- Fix function search paths
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.clean_expired_sessions() CASCADE;
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$;