-- Emergency fix: Temporarily disable RLS and create simple policies
-- This will get authentication working immediately

-- Disable RLS temporarily on user_roles table
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable all access for service role" ON user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Allow authenticated users to read their own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow service role full access (for server-side operations)
CREATE POLICY "Allow service role full access"
ON user_roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;
