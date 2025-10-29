/*
  # Sync Users by Dropping and Recreating FKs

  ## Summary
  Drops FK constraints, updates IDs, recreates constraints.
*/

-- Drop all FK constraints
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE rbac_violations DROP CONSTRAINT IF EXISTS rbac_violations_user_id_fkey;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_assigned_to_fkey;
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS decisions_officer_user_id_fkey;
ALTER TABLE decisions DROP CONSTRAINT IF EXISTS decisions_manager_user_id_fkey;

-- Create mapping
CREATE TEMP TABLE user_id_mapping AS
SELECT 
  pu.user_id as old_id,
  au.id as new_id,
  pu.email
FROM public.users pu
JOIN auth.users au ON pu.email = au.email
WHERE au.email LIKE '%@demo.com';

-- Update users
UPDATE users u
SET user_id = m.new_id
FROM user_id_mapping m
WHERE u.user_id = m.old_id;

-- Update all related tables
UPDATE audit_logs al SET user_id = m.new_id FROM user_id_mapping m WHERE al.user_id = m.old_id;
UPDATE rbac_violations rv SET user_id = m.new_id FROM user_id_mapping m WHERE rv.user_id = m.old_id;
UPDATE user_sessions us SET user_id = m.new_id FROM user_id_mapping m WHERE us.user_id = m.old_id;
UPDATE documents d SET uploaded_by = m.new_id FROM user_id_mapping m WHERE d.uploaded_by = m.old_id;
UPDATE documents d SET assigned_to = m.new_id FROM user_id_mapping m WHERE d.assigned_to = m.old_id;
UPDATE decisions dec SET officer_user_id = m.new_id FROM user_id_mapping m WHERE dec.officer_user_id = m.old_id;
UPDATE decisions dec SET manager_user_id = m.new_id FROM user_id_mapping m WHERE dec.manager_user_id = m.old_id;

-- Recreate FK constraints
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE rbac_violations ADD CONSTRAINT rbac_violations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE documents ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(user_id);
ALTER TABLE documents ADD CONSTRAINT documents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(user_id);
ALTER TABLE decisions ADD CONSTRAINT decisions_officer_user_id_fkey FOREIGN KEY (officer_user_id) REFERENCES users(user_id);
ALTER TABLE decisions ADD CONSTRAINT decisions_manager_user_id_fkey FOREIGN KEY (manager_user_id) REFERENCES users(user_id);

DO $$
BEGIN
  RAISE NOTICE '✅ User IDs synced successfully!';
  RAISE NOTICE '🎯 Login with: officer@demo.com / demo123';
END $$;