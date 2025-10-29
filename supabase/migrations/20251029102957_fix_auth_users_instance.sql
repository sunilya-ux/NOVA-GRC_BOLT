/*
  # Fix Auth Users Instance ID

  ## Summary
  Updates instance_id to NULL for all demo users as Supabase doesn't use instance_id
  in the hosted version.
*/

UPDATE auth.users 
SET instance_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE email LIKE '%@demo.com';