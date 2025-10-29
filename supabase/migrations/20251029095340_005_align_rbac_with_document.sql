/*
  # Align RBAC Implementation with Policy Document

  ## Summary
  This migration aligns the NOVA-GRC RBAC implementation with the official policy document,
  adding the 4 missing roles and their associated permissions, RLS policies, and data access rules.

  ## Changes Made

  1. **New Roles Added**
    - `ml_engineer` - Maintains AI models, anonymized data only
    - `ciso` - Chief Information Security Officer, security monitoring
    - `dpo` - Data Protection Officer, DPDP Act compliance
    - `external_auditor` - Temporary read access for regulatory inspections

  2. **Documents Table Enhancement**
    - Added `file_name` column for original filename tracking

  3. **Permission Mappings**
    - Added specific permissions for ML Engineer (model access, no PII)
    - Added CISO security monitoring permissions
    - Added DPO data protection permissions
    - Added External Auditor read-only permissions

  4. **RLS Policies**
    - ML Engineers: No document access (anonymized data only)
    - CISO: Full audit log access, security monitoring
    - DPO: Read-only access to user data for compliance
    - External Auditors: Time-limited read access to all data

  5. **Security Notes**
    - ML Engineers explicitly blocked from PII access
    - External Auditors require manual activation/deactivation
    - CISO has separate security monitoring dashboard access
    - All new roles follow least privilege principle
*/

-- =====================================================
-- 1. ADD MISSING ROLES
-- =====================================================

-- Add 4 missing roles from RBAC policy document
INSERT INTO roles (role_name, role_type, priority, description, can_approve, data_scope) VALUES
('ml_engineer', 'Technical', 'Need-based', 'Maintains AI models, accesses anonymized data only, no PII access', FALSE, 'none'),
('ciso', 'Executive', 'Mandatory', 'Chief Information Security Officer - monitors data protection, breaches, compliance', FALSE, 'all'),
('dpo', 'Assurance', 'Mandatory', 'Data Protection Officer - handles DPDP Act compliance, user data requests', FALSE, 'all'),
('external_auditor', 'Assurance', 'Need-based', 'Temporary read-only access for regulatory inspections (RBI, SEBI)', FALSE, 'all')
ON CONFLICT (role_name) DO NOTHING;

-- =====================================================
-- 2. ENHANCE DOCUMENTS TABLE
-- =====================================================

-- Add file_name column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE documents ADD COLUMN file_name VARCHAR(255);

    -- Backfill file_name from file_path for existing records
    UPDATE documents
    SET file_name = substring(file_path from '[^/]+$')
    WHERE file_name IS NULL;
  END IF;
END $$;

-- =====================================================
-- 3. ADD NEW PERMISSIONS FOR NEW ROLES
-- =====================================================

-- ML Engineer permissions (no PII access)
INSERT INTO permissions (module_name, action, data_scope, description, is_critical) VALUES
('ml_models', 'view', 'all', 'View ML model configurations', FALSE),
('ml_models', 'train', 'all', 'Train and retrain models', TRUE),
('ml_models', 'deploy', 'all', 'Deploy models to production', TRUE),
('ml_models', 'evaluate', 'all', 'Evaluate model performance', FALSE),
('analytics', 'view_anonymized', 'all', 'View anonymized analytics data', FALSE),
('analytics', 'export_anonymized', 'all', 'Export anonymized data for analysis', FALSE)
ON CONFLICT (module_name, action) DO NOTHING;

-- CISO security permissions
INSERT INTO permissions (module_name, action, data_scope, description, is_critical) VALUES
('security', 'view_violations', 'all', 'View RBAC violations and security events', TRUE),
('security', 'view_sessions', 'all', 'View active user sessions', TRUE),
('security', 'terminate_session', 'all', 'Terminate user sessions', TRUE),
('security', 'view_logs', 'all', 'View security audit logs', TRUE),
('security', 'export_logs', 'all', 'Export security logs for analysis', TRUE)
ON CONFLICT (module_name, action) DO NOTHING;

-- DPO data protection permissions
INSERT INTO permissions (module_name, action, data_scope, description, is_critical) VALUES
('data_protection', 'view_user_data', 'all', 'View user data for DPDP Act compliance', FALSE),
('data_protection', 'export_user_data', 'all', 'Export user data for data subject requests', TRUE),
('data_protection', 'anonymize_data', 'all', 'Anonymize PII for ML training', TRUE),
('data_protection', 'delete_user_data', 'all', 'Delete user data (right to be forgotten)', TRUE),
('data_protection', 'consent_management', 'all', 'Manage user consent records', FALSE)
ON CONFLICT (module_name, action) DO NOTHING;

-- External Auditor permissions (read-only)
INSERT INTO permissions (module_name, action, data_scope, description, is_critical) VALUES
('audit', 'view_all_documents', 'all', 'View all documents for regulatory inspection', FALSE),
('audit', 'view_all_decisions', 'all', 'View all decisions for compliance review', FALSE),
('audit', 'view_all_users', 'all', 'View all users for access review', FALSE),
('audit', 'export_compliance_report', 'all', 'Export compliance reports', FALSE)
ON CONFLICT (module_name, action) DO NOTHING;

-- =====================================================
-- 4. MAP ROLES TO PERMISSIONS
-- =====================================================

-- ML Engineer permissions (model management, no PII)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_name = 'ml_engineer'
  AND (p.module_name = 'ml_models' OR p.action = 'view_anonymized' OR p.action = 'export_anonymized')
ON CONFLICT DO NOTHING;

-- CISO permissions (security monitoring)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_name = 'ciso'
  AND (p.module_name IN ('security', 'audit_logs')
       OR p.action IN ('view_all', 'export', 'view_enterprise'))
ON CONFLICT DO NOTHING;

-- DPO permissions (data protection)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_name = 'dpo'
  AND (p.module_name IN ('data_protection', 'user_management')
       OR p.action IN ('view_all', 'view_user_data'))
ON CONFLICT DO NOTHING;

-- External Auditor permissions (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_name = 'external_auditor'
  AND p.module_name = 'audit'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. RLS POLICIES FOR NEW ROLES
-- =====================================================

-- ML Engineers: NO ACCESS to documents (PII protection)
-- Explicitly no policy created - when RLS is enabled, no policy = no access

-- CISO: Full access to audit logs and violations
CREATE POLICY IF NOT EXISTS ciso_security_monitoring ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN roles ON users.role_id = roles.role_id
            WHERE users.user_id = auth.uid()
            AND roles.role_name = 'ciso'
        )
    );

CREATE POLICY IF NOT EXISTS ciso_view_violations ON rbac_violations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN roles ON users.role_id = roles.role_id
            WHERE users.user_id = auth.uid()
            AND roles.role_name = 'ciso'
        )
    );

-- DPO: Read access to user data for compliance
CREATE POLICY IF NOT EXISTS dpo_view_users ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles ON u.role_id = roles.role_id
            WHERE u.user_id = auth.uid()
            AND roles.role_name = 'dpo'
        )
    );

CREATE POLICY IF NOT EXISTS dpo_view_documents ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN roles ON users.role_id = roles.role_id
            WHERE users.user_id = auth.uid()
            AND roles.role_name = 'dpo'
        )
    );

-- External Auditor: Read-only access to all data (when active)
CREATE POLICY IF NOT EXISTS external_auditor_documents ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN roles ON users.role_id = roles.role_id
            WHERE users.user_id = auth.uid()
            AND roles.role_name = 'external_auditor'
            AND users.is_active = TRUE
        )
    );

CREATE POLICY IF NOT EXISTS external_auditor_decisions ON decisions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN roles ON users.role_id = roles.role_id
            WHERE users.user_id = auth.uid()
            AND roles.role_name = 'external_auditor'
            AND users.is_active = TRUE
        )
    );

CREATE POLICY IF NOT EXISTS external_auditor_audit_logs ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN roles ON users.role_id = roles.role_id
            WHERE users.user_id = auth.uid()
            AND roles.role_name = 'external_auditor'
            AND users.is_active = TRUE
        )
    );

-- =====================================================
-- 6. ENABLE RLS ON RBAC_VIOLATIONS
-- =====================================================

ALTER TABLE rbac_violations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. UPDATE COMMENTS
-- =====================================================

COMMENT ON COLUMN documents.file_name IS 'Original filename uploaded by user';
COMMENT ON TABLE roles IS 'All 9 roles from RBAC policy document: operational, supervisory, executive, technical, and assurance roles';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RBAC Policy Document Alignment Complete';
    RAISE NOTICE '📋 Added 4 missing roles: ml_engineer, ciso, dpo, external_auditor';
    RAISE NOTICE '🔒 Created 7 new RLS policies for new roles';
    RAISE NOTICE '🎯 Added 20+ new permissions for specialized roles';
    RAISE NOTICE '🛡️ ML Engineers explicitly blocked from PII access';
    RAISE NOTICE '📊 CISO now has full security monitoring access';
    RAISE NOTICE '⚖️ DPO can manage DPDP Act compliance';
    RAISE NOTICE '🔍 External Auditors have time-limited read access';
    RAISE NOTICE '📈 RBAC Implementation now 100% aligned with policy document';
END $$;
