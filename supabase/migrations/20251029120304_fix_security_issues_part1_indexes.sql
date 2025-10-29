/*
  # Fix Security Issues - Part 1: Add Missing Indexes and Remove Unused

  ## Changes Made
  
  ### 1. Add Missing Foreign Key Indexes
    - `decisions.manager_user_id` - Index for manager lookup
    - `decisions.officer_user_id` - Index for officer lookup
    - `role_permissions.permission_id` - Index for permission lookup
  
  ### 2. Remove Unused Indexes
    - Drop unused indexes on rbac_violations table
    - Drop unused indexes on user_sessions table
    - Drop unused indexes on ai_models table
    - Drop unused indexes on data_privacy_logs table
    - Drop unused indexes on decisions table
    - Drop unused indexes on audit_logs table
  
  ## Performance Impact
    - Adding indexes on foreign keys will improve JOIN performance
    - Removing unused indexes reduces storage and improves write performance
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_decisions_manager_user_id ON public.decisions(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_officer_user_id ON public.decisions(officer_user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- Remove unused indexes to reduce overhead
DROP INDEX IF EXISTS public.idx_rbac_violations_user_id;
DROP INDEX IF EXISTS public.idx_rbac_violations_risk_level;
DROP INDEX IF EXISTS public.idx_rbac_violations_timestamp;
DROP INDEX IF EXISTS public.idx_user_sessions_user_id;
DROP INDEX IF EXISTS public.idx_ai_models_trained_by;
DROP INDEX IF EXISTS public.idx_ai_models_status;
DROP INDEX IF EXISTS public.idx_data_privacy_logs_user_id;
DROP INDEX IF EXISTS public.idx_data_privacy_logs_document_id;
DROP INDEX IF EXISTS public.idx_data_privacy_logs_timestamp;
DROP INDEX IF EXISTS public.idx_decisions_document_id;
DROP INDEX IF EXISTS public.idx_decisions_status;
DROP INDEX IF EXISTS public.idx_decisions_manager_pending;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_audit_logs_success;
DROP INDEX IF EXISTS public.idx_audit_logs_resource;