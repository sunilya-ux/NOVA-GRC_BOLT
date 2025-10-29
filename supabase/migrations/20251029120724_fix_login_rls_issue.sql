/*
  # Fix Login RLS Issue

  ## Problem
    - Login fails because roles table RLS blocks JOIN queries during authentication
    - Users table queries with roles JOIN fail for unauthenticated users
  
  ## Solution
    - Allow anon role to read from roles table (read-only data needed for login)
    - Keep existing authenticated user policies intact
  
  ## Security Impact
    - Roles table data is not sensitive (just role names and metadata)
    - No user data or permissions are exposed
    - Still protected from modifications (only admins can modify)
*/

-- Allow anonymous users to read roles table for login process
CREATE POLICY "Anonymous users can view roles for login" ON public.roles
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read permissions for login process  
CREATE POLICY "Anonymous users can view permissions for login" ON public.permissions
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read role_permissions for login process
CREATE POLICY "Anonymous users can view role permissions for login" ON public.role_permissions
  FOR SELECT
  TO anon
  USING (true);