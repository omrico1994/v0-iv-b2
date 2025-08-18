-- Comprehensive script to reset all RLS policies safely
-- This script drops all existing policies and creates clean ones

-- Drop all existing policies with IF EXISTS to avoid errors
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_service_role_all" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON user_roles;

DROP POLICY IF EXISTS "retailers_select_own" ON retailers;
DROP POLICY IF EXISTS "retailers_insert_own" ON retailers;
DROP POLICY IF EXISTS "retailers_update_own" ON retailers;
DROP POLICY IF EXISTS "retailers_delete_own" ON retailers;
DROP POLICY IF EXISTS "retailers_service_role_all" ON retailers;

DROP POLICY IF EXISTS "locations_select_own" ON locations;
DROP POLICY IF EXISTS "locations_insert_own" ON locations;
DROP POLICY IF EXISTS "locations_update_own" ON locations;
DROP POLICY IF EXISTS "locations_delete_own" ON locations;
DROP POLICY IF EXISTS "locations_service_role_all" ON locations;

-- Temporarily disable RLS to ensure clean state
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE retailers DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for user_roles
CREATE POLICY "user_roles_select_own" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roles_service_role_all" ON user_roles
    FOR ALL USING (auth.role() = 'service_role');

-- Create simple policies for retailers
CREATE POLICY "retailers_select_all" ON retailers
    FOR SELECT USING (true);

CREATE POLICY "retailers_service_role_all" ON retailers
    FOR ALL USING (auth.role() = 'service_role');

-- Create simple policies for locations  
CREATE POLICY "locations_select_all" ON locations
    FOR SELECT USING (true);

CREATE POLICY "locations_service_role_all" ON locations
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON retailers TO authenticated;
GRANT SELECT ON locations TO authenticated;

GRANT ALL ON user_roles TO service_role;
GRANT ALL ON retailers TO service_role;
GRANT ALL ON locations TO service_role;
