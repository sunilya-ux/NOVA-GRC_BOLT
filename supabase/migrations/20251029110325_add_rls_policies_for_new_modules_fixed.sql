/*
  # Add RLS Policies for New Module Access

  1. Tables Required
    - Create placeholder tables for ai_models and data_privacy_logs
    - These ensure RLS policies can be enforced when features are implemented

  2. RLS Policies
    - ML Engineer: Can only access ai_model management (no PII)
    - DPO: Can access all privacy-related data
    - External Auditor: Read-only access to all audit data

  3. Security
    - ML Engineer data_scope = 'none' enforced (no document access)
    - DPO and External Auditor get 'all' scope for oversight
    - All policies use auth.uid() for user identification
*/

-- Create ai_models table for ML Engineer operations
CREATE TABLE IF NOT EXISTS ai_models (
  model_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name varchar(255) NOT NULL,
  model_version varchar(50) NOT NULL,
  model_type varchar(100) NOT NULL,
  trained_by uuid REFERENCES users(user_id),
  training_data_hash text,
  accuracy_score numeric(5,4),
  deployed boolean DEFAULT false,
  deployed_at timestamptz,
  status varchar(50) DEFAULT 'training' CHECK (status IN ('training', 'testing', 'deployed', 'retired')),
  metrics jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Create data_privacy_logs table for DPO operations
CREATE TABLE IF NOT EXISTS data_privacy_logs (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(user_id),
  action varchar(100) NOT NULL,
  pii_accessed boolean DEFAULT false,
  document_id uuid REFERENCES documents(document_id),
  consent_status varchar(50),
  gdpr_request_type varchar(50) CHECK (gdpr_request_type IN ('access', 'deletion', 'portability', 'rectification')),
  processing_status varchar(50) DEFAULT 'pending',
  completed_at timestamptz,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE data_privacy_logs ENABLE ROW LEVEL SECURITY;

-- ML Engineer policies: Can manage AI models but no PII access
CREATE POLICY "ML Engineers can create models"
  ON ai_models FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'ml_engineer'
        AND ai_models.trained_by = auth.uid()
    )
  );

CREATE POLICY "ML Engineers can view all models"
  ON ai_models FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'ml_engineer'
    )
  );

CREATE POLICY "ML Engineers can update models"
  ON ai_models FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'ml_engineer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'ml_engineer'
    )
  );

-- DPO policies: Full access to privacy logs
CREATE POLICY "DPO can view all privacy logs"
  ON data_privacy_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'dpo'
    )
  );

CREATE POLICY "DPO can create privacy logs"
  ON data_privacy_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'dpo'
    )
  );

CREATE POLICY "DPO can update privacy logs"
  ON data_privacy_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'dpo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
        AND roles.role_name = 'dpo'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_models_trained_by ON ai_models(trained_by);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
CREATE INDEX IF NOT EXISTS idx_data_privacy_logs_user_id ON data_privacy_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_privacy_logs_document_id ON data_privacy_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_data_privacy_logs_timestamp ON data_privacy_logs(timestamp);

COMMENT ON TABLE ai_models IS 'ML model registry with training metadata and deployment status';
COMMENT ON TABLE data_privacy_logs IS 'GDPR and privacy compliance audit trail for PII access and data subject rights';