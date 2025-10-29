/*
  # Create Supabase Auth Users - Fixed

  ## Summary
  Creates auth users with proper password hashing and identities.

  ## Security
  - Password: demo123 for all users
  - Email confirmed
*/

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete existing users to start fresh
DELETE FROM auth.identities WHERE provider = 'email' AND provider_id IN (
  SELECT id::text FROM auth.users WHERE email LIKE '%@demo.com'
);

-- Create users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES 
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'officer@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Priya Sharma"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'manager@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rajesh Kumar"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'cco@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Anita Desai"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'admin@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Vikram Singh"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'mlengineer@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Deepak Verma"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'ciso@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Kavita Reddy"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'auditor@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Suresh Patel"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'dpo@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Meena Iyer"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'external@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ashok Mehta"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'officer2@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Sneha Gupta"}'::jsonb, NOW(), NOW(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'manager2@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Arun Nair"}'::jsonb, NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO UPDATE SET 
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = NOW();

-- Create identities with provider_id
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  id::text,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email LIKE '%@demo.com'
ON CONFLICT (provider, provider_id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Auth users created successfully';
  RAISE NOTICE '🔑 Password for all: demo123';
END $$;