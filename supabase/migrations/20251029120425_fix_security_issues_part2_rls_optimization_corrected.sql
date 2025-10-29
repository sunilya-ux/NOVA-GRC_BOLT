/*
  # Fix Security Issues - Part 2: Optimize RLS Policies (Corrected)

  ## Changes Made
  
  ### 1. Optimize Documents Table RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` for better performance
    - Use correct column names: user_id instead of id
    - Use role_id with JOIN to roles table
  
  ### 2. Optimize Audit Logs Table RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` for better performance
  
  ### 3. Optimize AI Models Table RLS Policies
    - Replace user role checks with optimized subquery pattern
  
  ### 4. Optimize Data Privacy Logs Table RLS Policies
    - Replace user role checks with optimized subquery pattern
  
  ## Performance Impact
    - Auth functions will be evaluated once per query instead of per row
    - Significant performance improvement for large datasets
*/

-- Drop and recreate documents table policies with optimization
DROP POLICY IF EXISTS officer_own_documents ON public.documents;
DROP POLICY IF EXISTS manager_team_documents ON public.documents;
DROP POLICY IF EXISTS executive_all_documents ON public.documents;
DROP POLICY IF EXISTS officer_insert_own_documents ON public.documents;
DROP POLICY IF EXISTS manager_insert_documents ON public.documents;
DROP POLICY IF EXISTS executive_insert_documents ON public.documents;
DROP POLICY IF EXISTS dpo_insert_documents ON public.documents;
DROP POLICY IF EXISTS officer_update_own_documents ON public.documents;
DROP POLICY IF EXISTS manager_update_team_documents ON public.documents;
DROP POLICY IF EXISTS executive_update_all_documents ON public.documents;

-- Optimized SELECT policies for documents
CREATE POLICY officer_own_documents ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'compliance_officer'
    )
  );

CREATE POLICY manager_team_documents ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.roles r1 ON u1.role_id = r1.role_id
      WHERE u1.user_id = (select auth.uid())
      AND r1.role_name = 'compliance_manager'
      AND EXISTS (
        SELECT 1 FROM public.users u2
        WHERE u2.user_id = documents.uploaded_by
        AND u2.team_id = u1.team_id
      )
    )
  );

CREATE POLICY executive_all_documents ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('cco', 'ciso', 'system_admin', 'internal_auditor', 'external_auditor', 'dpo')
    )
  );

-- Optimized INSERT policies for documents
CREATE POLICY officer_insert_own_documents ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'compliance_officer'
    )
  );

CREATE POLICY manager_insert_documents ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'compliance_manager'
    )
  );

CREATE POLICY executive_insert_documents ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('cco', 'system_admin')
    )
  );

CREATE POLICY dpo_insert_documents ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'dpo'
    )
  );

-- Optimized UPDATE policies for documents
CREATE POLICY officer_update_own_documents ON public.documents
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'compliance_officer'
    )
  )
  WITH CHECK (
    uploaded_by = (select auth.uid())
  );

CREATE POLICY manager_update_team_documents ON public.documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.roles r1 ON u1.role_id = r1.role_id
      WHERE u1.user_id = (select auth.uid())
      AND r1.role_name = 'compliance_manager'
      AND EXISTS (
        SELECT 1 FROM public.users u2
        WHERE u2.user_id = documents.uploaded_by
        AND u2.team_id = u1.team_id
      )
    )
  );

CREATE POLICY executive_update_all_documents ON public.documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('cco', 'compliance_manager')
    )
  );

-- Drop and recreate audit_logs policies with optimization
DROP POLICY IF EXISTS users_own_audit_logs ON public.audit_logs;
DROP POLICY IF EXISTS managers_team_audit_logs ON public.audit_logs;
DROP POLICY IF EXISTS executives_all_audit_logs ON public.audit_logs;

-- Optimized SELECT policies for audit_logs
CREATE POLICY users_own_audit_logs ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('compliance_officer', 'compliance_manager', 'dpo')
    )
  );

CREATE POLICY managers_team_audit_logs ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1
      JOIN public.roles r1 ON u1.role_id = r1.role_id
      WHERE u1.user_id = (select auth.uid())
      AND r1.role_name = 'compliance_manager'
      AND EXISTS (
        SELECT 1 FROM public.users u2
        WHERE u2.user_id = audit_logs.user_id
        AND u2.team_id = u1.team_id
      )
    )
  );

CREATE POLICY executives_all_audit_logs ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('cco', 'ciso', 'system_admin', 'internal_auditor', 'external_auditor')
    )
  );

-- Drop and recreate ai_models policies with optimization
DROP POLICY IF EXISTS "ML Engineers can create models" ON public.ai_models;
DROP POLICY IF EXISTS "ML Engineers can view all models" ON public.ai_models;
DROP POLICY IF EXISTS "ML Engineers can update models" ON public.ai_models;

CREATE POLICY "ML Engineers can create models" ON public.ai_models
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'ml_engineer'
    )
  );

CREATE POLICY "ML Engineers can view all models" ON public.ai_models
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('ml_engineer', 'system_admin', 'cco')
    )
  );

CREATE POLICY "ML Engineers can update models" ON public.ai_models
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('ml_engineer', 'system_admin')
    )
  );

-- Drop and recreate data_privacy_logs policies with optimization
DROP POLICY IF EXISTS "DPO can view all privacy logs" ON public.data_privacy_logs;
DROP POLICY IF EXISTS "DPO can create privacy logs" ON public.data_privacy_logs;
DROP POLICY IF EXISTS "DPO can update privacy logs" ON public.data_privacy_logs;

CREATE POLICY "DPO can view all privacy logs" ON public.data_privacy_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name IN ('dpo', 'ciso', 'internal_auditor', 'external_auditor')
    )
  );

CREATE POLICY "DPO can create privacy logs" ON public.data_privacy_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'dpo'
    )
  );

CREATE POLICY "DPO can update privacy logs" ON public.data_privacy_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      JOIN public.roles ON users.role_id = roles.role_id
      WHERE users.user_id = (select auth.uid())
      AND roles.role_name = 'dpo'
    )
  );