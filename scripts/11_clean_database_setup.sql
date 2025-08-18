-- Clean Database Setup for Authentication System
-- This script sets up proper RLS policies without recursion issues

-- First, drop all existing policies to start clean
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_roles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_roles;

-- Ensure RLS is enabled on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive RLS policies for user_roles
-- Policy 1: Users can read their own role data
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Service role can do everything (for admin operations)
CREATE POLICY "user_roles_service_role_all" ON user_roles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create policies for retailers table
CREATE POLICY "retailers_select_all" ON retailers
  FOR SELECT
  USING (true); -- All authenticated users can read retailers

CREATE POLICY "retailers_service_role_all" ON retailers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create policies for locations table  
CREATE POLICY "locations_select_all" ON locations
  FOR SELECT
  USING (true); -- All authenticated users can read locations

CREATE POLICY "locations_service_role_all" ON locations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON retailers TO authenticated;
GRANT SELECT ON locations TO authenticated;

-- Grant full access to service role
GRANT ALL ON user_roles TO service_role;
GRANT ALL ON retailers TO service_role;
GRANT ALL ON locations TO service_role;
