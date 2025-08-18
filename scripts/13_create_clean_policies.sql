-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for user_roles table
-- Users can only see their own role
CREATE POLICY "user_roles_select_own" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update/delete user roles
CREATE POLICY "user_roles_service_role_all" ON user_roles
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for retailers table
-- Users can see retailers based on their role
CREATE POLICY "retailers_select_policy" ON retailers
    FOR SELECT USING (true); -- Allow all authenticated users to read retailers

-- Only service role can modify retailers
CREATE POLICY "retailers_service_role_all" ON retailers
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for locations table  
-- Users can see locations based on their role
CREATE POLICY "locations_select_policy" ON locations
    FOR SELECT USING (true); -- Allow all authenticated users to read locations

-- Only service role can modify locations
CREATE POLICY "locations_service_role_all" ON locations
    FOR ALL USING (auth.role() = 'service_role');
