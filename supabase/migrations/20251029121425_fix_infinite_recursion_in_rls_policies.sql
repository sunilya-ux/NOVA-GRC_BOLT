/*
  # Fix Infinite Recursion in RLS Policies

  ## Problem
    - "System admins can manage roles" policy causes infinite recursion
    - Policy checks users table → JOINs to roles table → triggers RLS on roles → checks users → infinite loop
    - Same issue affects permissions and role_permissions tables
  
  ## Solution
    - Remove the recursive policies that JOIN back to roles table
    - Use a simpler approach: use service role key for admin operations
    - OR: Check user_id directly against a hardcoded list of admin IDs
    - For now: Remove the admin management policies (they can be managed via SQL)
  
  ## Impact
    - Read access remains for all users (needed for login)
    - Write access must be done via SQL or service role (secure)
    - Removes infinite recursion completely
*/

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "System admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "System admins can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "System admins can manage role permissions" ON public.role_permissions;

-- Drop similar problematic policies on users table
DROP POLICY IF EXISTS "System admins can insert users" ON public.users;
DROP POLICY IF EXISTS "System admins can update users" ON public.users;