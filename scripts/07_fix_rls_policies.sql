-- Fix infinite recursion in user_roles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;

-- Create simple, non-recursive policies
-- Allow users to read their own role data
CREATE POLICY "user_roles_select_own" ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow service role to manage all user roles (for admin operations)
CREATE POLICY "user_roles_service_role_all" ON user_roles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
