/*
  # Fix Users Table RLS for Login

  ## Problem
    - After Supabase Auth login, the authenticated user cannot query their own data from public.users
    - The RLS policy "Users can read own record" with USING (true) should work but might not be applying correctly
    - Need to ensure authenticated users can read from users table with JOIN to roles
  
  ## Solution
    - Drop and recreate the authenticated user policy with explicit logic
    - Ensure the policy allows authenticated users to read any user record
    - This is needed because during login, we need to fetch the user's details
  
  ## Security Impact
    - Authenticated users can read from users table (needed for application functionality)
    - Still protected: password_hash should be excluded in application queries
    - Write operations remain restricted
*/

-- Drop existing authenticated user policy
DROP POLICY IF EXISTS "Users can read own record" ON public.users;

-- Create a clearer policy for authenticated users
CREATE POLICY "Authenticated users can read users table" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure system admins can manage users
CREATE POLICY "System admins can insert users" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.role_id
      WHERE u.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

CREATE POLICY "System admins can update users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.role_id
      WHERE u.user_id = (select auth.uid())
      AND r.role_name = 'system_admin'
    )
  );

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));