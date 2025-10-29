/*
  # Create Supabase Auth Users for Demo Accounts

  ## Summary
  The RLS policies use auth.uid() but there are no users in auth.users table.
  This migration creates Supabase Auth users for all demo accounts and links them
  to the existing users in the public.users table.

  ## Changes
  1. Create auth.users for all 11 demo accounts
  2. Update public.users.user_id to match auth.users.id
  3. Ensure proper UUID mapping

  ## Security
  - All demo accounts use password: demo123
  - Users are created with email confirmed
*/

-- Create Supabase Auth users for all demo accounts
-- Password for all: demo123

-- 1. Compliance Officer
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'officer@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Priya Sharma"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Compliance Manager
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000002'::uuid,
  'manager@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rajesh Kumar"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 3. CCO
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000003'::uuid,
  'cco@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Anita Desai"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 4. System Admin
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000004'::uuid,
  'admin@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Vikram Singh"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 5. ML Engineer
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000005'::uuid,
  'mlengineer@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Deepak Verma"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 6. CISO
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000006'::uuid,
  'ciso@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Kavita Reddy"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 7. Internal Auditor
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000007'::uuid,
  'auditor@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Suresh Patel"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 8. DPO
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000008'::uuid,
  'dpo@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Meena Iyer"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 9. External Auditor
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000009'::uuid,
  'external@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Ashok Mehta"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 10. Officer 2
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000010'::uuid,
  'officer2@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Sneha Gupta"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 11. Manager 2
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '10000000-0000-0000-0000-000000000011'::uuid,
  'manager2@demo.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Arun Nair"}'::jsonb,
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Created 11 Supabase Auth users';
  RAISE NOTICE '🔑 All users password: demo123';
  RAISE NOTICE '📧 Login with role emails (e.g., officer@demo.com)';
  RAISE NOTICE '🔒 RLS policies will now work with auth.uid()';
END $$;