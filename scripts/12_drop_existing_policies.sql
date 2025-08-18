-- Adding missing service role policies to drop list
-- Drop all existing RLS policies that may be causing recursion issues
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_service_role_all" ON user_roles;

DROP POLICY IF EXISTS "retailers_select_policy" ON retailers;
DROP POLICY IF EXISTS "retailers_insert_policy" ON retailers;
DROP POLICY IF EXISTS "retailers_update_policy" ON retailers;
DROP POLICY IF EXISTS "retailers_delete_policy" ON retailers;
DROP POLICY IF EXISTS "retailers_service_role_all" ON retailers;

DROP POLICY IF EXISTS "locations_select_policy" ON locations;
DROP POLICY IF EXISTS "locations_insert_policy" ON locations;
DROP POLICY IF EXISTS "locations_update_policy" ON locations;
DROP POLICY IF EXISTS "locations_delete_policy" ON locations;
DROP POLICY IF EXISTS "locations_service_role_all" ON locations;

-- Disable RLS temporarily to clean up
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE retailers DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
