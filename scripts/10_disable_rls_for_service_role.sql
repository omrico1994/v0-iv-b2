-- Ensure service role can access user_roles table without RLS restrictions
-- This is safe because service role is only used server-side for administrative operations

-- Temporarily disable RLS for debugging (can be re-enabled later with proper policies)
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON retailers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON locations TO service_role;

-- Re-enable RLS with a simple policy that allows service role full access
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows service role to bypass RLS
CREATE POLICY "Service role has full access" ON user_roles
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure authenticated users can still read their own roles
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());
