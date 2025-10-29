/*
  # Fix Document Upload RLS Policies

  ## Summary
  Add INSERT policies for documents table to allow users to upload documents.
  Currently only SELECT policies exist, blocking all uploads.

  ## Changes
  1. Add INSERT policy for compliance officers to upload documents
  2. Add INSERT policy for compliance managers to upload documents  
  3. Add INSERT policy for executives to upload documents
  4. Add UPDATE policies to allow status changes during processing

  ## Security
  - Users can only insert documents assigned to themselves
  - All policies verify role and authentication
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "officer_insert_own_documents" ON documents;
DROP POLICY IF EXISTS "manager_insert_documents" ON documents;
DROP POLICY IF EXISTS "executive_insert_documents" ON documents;
DROP POLICY IF EXISTS "dpo_insert_documents" ON documents;
DROP POLICY IF EXISTS "officer_update_own_documents" ON documents;
DROP POLICY IF EXISTS "manager_update_team_documents" ON documents;
DROP POLICY IF EXISTS "executive_update_all_documents" ON documents;

-- =====================================================
-- INSERT POLICIES - Allow document uploads
-- =====================================================

-- Compliance Officers can insert their own documents
CREATE POLICY "officer_insert_own_documents" ON documents
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role_id = (SELECT role_id FROM roles WHERE role_name = 'compliance_officer')
      AND documents.uploaded_by = auth.uid()
    )
  );

-- Compliance Managers can insert documents
CREATE POLICY "manager_insert_documents" ON documents
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role_id = (SELECT role_id FROM roles WHERE role_name = 'compliance_manager')
      AND documents.uploaded_by = auth.uid()
    )
  );

-- Executives can insert documents
CREATE POLICY "executive_insert_documents" ON documents
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
      AND roles.role_name IN ('cco', 'ciso', 'system_admin')
      AND documents.uploaded_by = auth.uid()
    )
  );

-- DPO can insert documents
CREATE POLICY "dpo_insert_documents" ON documents
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
      AND roles.role_name = 'dpo'
      AND documents.uploaded_by = auth.uid()
    )
  );

-- =====================================================
-- UPDATE POLICIES - Allow status updates during processing
-- =====================================================

-- Officers can update their own documents
CREATE POLICY "officer_update_own_documents" ON documents
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role_id = (SELECT role_id FROM roles WHERE role_name = 'compliance_officer')
      AND documents.uploaded_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role_id = (SELECT role_id FROM roles WHERE role_name = 'compliance_officer')
      AND documents.uploaded_by = auth.uid()
    )
  );

-- Managers can update team documents
CREATE POLICY "manager_update_team_documents" ON documents
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.team_id = u2.team_id
      WHERE u1.user_id = auth.uid()
      AND u1.role_id = (SELECT role_id FROM roles WHERE role_name = 'compliance_manager')
      AND documents.uploaded_by = u2.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.team_id = u2.team_id
      WHERE u1.user_id = auth.uid()
      AND u1.role_id = (SELECT role_id FROM roles WHERE role_name = 'compliance_manager')
      AND documents.uploaded_by = u2.user_id
    )
  );

-- Executives can update all documents
CREATE POLICY "executive_update_all_documents" ON documents
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
      AND roles.role_name IN ('cco', 'ciso', 'system_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE users.user_id = auth.uid()
      AND roles.role_name IN ('cco', 'ciso', 'system_admin')
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Document upload RLS policies created';
  RAISE NOTICE '📝 Users can now upload and process documents';
END $$;