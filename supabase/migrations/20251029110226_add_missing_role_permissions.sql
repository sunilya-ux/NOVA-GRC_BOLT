/*
  # Add Missing Permissions for ML Engineer, DPO, and External Auditor

  1. New Permissions
    - ML Engineer permissions:
      - `ai_model:train` - Train ML models on anonymized data
      - `ai_model:deploy` - Deploy models to production
      - `ai_model:monitor` - Monitor model performance
      - `ai_model:view_metrics` - View model accuracy metrics
    
    - DPO (Data Protection Officer) permissions:
      - `data_privacy:view_pii_access` - Monitor who accessed PII
      - `data_privacy:manage_consent` - Manage user consent
      - `data_privacy:data_deletion` - Handle GDPR erasure requests
      - `data_privacy:export_data` - Export user data (GDPR portability)
    
    - External Auditor permissions:
      - Re-use existing audit_logs permissions
      - Re-use existing document_processing:view_all
      - Re-use existing dashboards:view_enterprise

  2. Role Mappings
    - Assign ML Engineer permissions to ml_engineer role
    - Assign DPO permissions to dpo role
    - Assign read-only audit permissions to external_auditor role

  3. Security
    - All new permissions follow existing data_scope patterns
    - ML Engineer has 'none' scope (no PII access)
    - DPO and External Auditor have 'all' scope (oversight roles)
*/

-- Insert new permissions for ML Engineer
INSERT INTO permissions (module_name, action, data_scope, description, is_critical) VALUES
('ai_model', 'train', 'none', 'Train ML models on anonymized data', false),
('ai_model', 'deploy', 'none', 'Deploy ML models to production', true),
('ai_model', 'monitor', 'none', 'Monitor model performance and accuracy', false),
('ai_model', 'view_metrics', 'none', 'View model performance metrics', false)
ON CONFLICT DO NOTHING;

-- Insert new permissions for DPO
INSERT INTO permissions (module_name, action, data_scope, description, is_critical) VALUES
('data_privacy', 'view_pii_access', 'all', 'Monitor PII access logs', true),
('data_privacy', 'manage_consent', 'all', 'Manage user consent records', true),
('data_privacy', 'data_deletion', 'all', 'Process GDPR erasure requests', true),
('data_privacy', 'export_data', 'all', 'Export user data for GDPR portability', false)
ON CONFLICT DO NOTHING;

-- Get role IDs for mapping
DO $$
DECLARE
  ml_engineer_role_id INT;
  dpo_role_id INT;
  external_auditor_role_id INT;
BEGIN
  -- Get role IDs
  SELECT role_id INTO ml_engineer_role_id FROM roles WHERE role_name = 'ml_engineer';
  SELECT role_id INTO dpo_role_id FROM roles WHERE role_name = 'dpo';
  SELECT role_id INTO external_auditor_role_id FROM roles WHERE role_name = 'external_auditor';

  -- Assign ML Engineer permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT ml_engineer_role_id, permission_id
  FROM permissions
  WHERE module_name = 'ai_model'
  ON CONFLICT DO NOTHING;

  -- Assign DPO permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT dpo_role_id, permission_id
  FROM permissions
  WHERE module_name = 'data_privacy'
  ON CONFLICT DO NOTHING;

  -- DPO also needs audit log access
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT dpo_role_id, permission_id
  FROM permissions
  WHERE module_name = 'audit_logs' AND action IN ('view_all', 'export')
  ON CONFLICT DO NOTHING;

  -- DPO needs document access for PII compliance checks
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT dpo_role_id, permission_id
  FROM permissions
  WHERE module_name = 'document_processing' AND action = 'view_all'
  ON CONFLICT DO NOTHING;

  -- DPO needs enterprise dashboard for compliance monitoring
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT dpo_role_id, permission_id
  FROM permissions
  WHERE module_name = 'dashboards' AND action = 'view_enterprise'
  ON CONFLICT DO NOTHING;

  -- Assign External Auditor permissions (read-only access)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT external_auditor_role_id, permission_id
  FROM permissions
  WHERE module_name = 'audit_logs' AND action IN ('view_all', 'export')
  ON CONFLICT DO NOTHING;

  -- External Auditor needs document access
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT external_auditor_role_id, permission_id
  FROM permissions
  WHERE module_name = 'document_processing' AND action = 'view_all'
  ON CONFLICT DO NOTHING;

  -- External Auditor needs dashboard access
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT external_auditor_role_id, permission_id
  FROM permissions
  WHERE module_name = 'dashboards' AND action = 'view_enterprise'
  ON CONFLICT DO NOTHING;

  -- External Auditor needs system config view for compliance audits
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT external_auditor_role_id, permission_id
  FROM permissions
  WHERE module_name = 'system_config' AND action = 'view'
  ON CONFLICT DO NOTHING;

END $$;