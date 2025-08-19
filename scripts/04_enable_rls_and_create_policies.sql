-- Enable RLS on all tables
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for retailers table
CREATE POLICY "retailers_select_policy" ON retailers
    FOR SELECT USING (
        is_admin_or_office(auth.uid()) OR 
        has_retailer_access(id, auth.uid())
    );

CREATE POLICY "retailers_insert_policy" ON retailers
    FOR INSERT WITH CHECK (is_admin_or_office(auth.uid()));

CREATE POLICY "retailers_update_policy" ON retailers
    FOR UPDATE USING (is_admin_or_office(auth.uid()));

CREATE POLICY "retailers_delete_policy" ON retailers
    FOR DELETE USING (is_admin_or_office(auth.uid()));

-- RLS Policies for locations table
CREATE POLICY "locations_select_policy" ON locations
    FOR SELECT USING (
        is_admin_or_office(auth.uid()) OR 
        has_retailer_access(retailer_id, auth.uid()) OR
        has_location_access(id, auth.uid())
    );

CREATE POLICY "locations_insert_policy" ON locations
    FOR INSERT WITH CHECK (
        is_admin_or_office(auth.uid()) OR 
        has_retailer_access(retailer_id, auth.uid())
    );

CREATE POLICY "locations_update_policy" ON locations
    FOR UPDATE USING (
        is_admin_or_office(auth.uid()) OR 
        has_retailer_access(retailer_id, auth.uid())
    );

CREATE POLICY "locations_delete_policy" ON locations
    FOR DELETE USING (is_admin_or_office(auth.uid()));

-- RLS Policies for user_roles table
CREATE POLICY "user_roles_select_own" ON user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        is_admin_or_office(auth.uid())
    );

CREATE POLICY "user_roles_insert_policy" ON user_roles
    FOR INSERT WITH CHECK (is_admin_or_office(auth.uid()));

CREATE POLICY "user_roles_update_policy" ON user_roles
    FOR UPDATE USING (is_admin_or_office(auth.uid()));

CREATE POLICY "user_roles_delete_policy" ON user_roles
    FOR DELETE USING (is_admin_or_office(auth.uid()));

-- RLS Policies for user_location_memberships table
CREATE POLICY "user_location_memberships_select_own" ON user_location_memberships
    FOR SELECT USING (
        user_id = auth.uid() OR 
        is_admin_or_office(auth.uid()) OR
        has_location_access(location_id, auth.uid())
    );

CREATE POLICY "user_location_memberships_insert_policy" ON user_location_memberships
    FOR INSERT WITH CHECK (is_admin_or_office(auth.uid()));

CREATE POLICY "user_location_memberships_update_policy" ON user_location_memberships
    FOR UPDATE USING (is_admin_or_office(auth.uid()));

CREATE POLICY "user_location_memberships_delete_policy" ON user_location_memberships
    FOR DELETE USING (is_admin_or_office(auth.uid()));

-- RLS Policies for audit_logs table
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT USING (can_access_audit_logs(auth.uid()));

CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT WITH CHECK (true); -- Allow system to insert audit logs

-- No update/delete policies for audit_logs (immutable)

-- RLS Policies for orders table
CREATE POLICY "orders_select_policy" ON orders
    FOR SELECT USING (has_location_access(location_id, auth.uid()));

CREATE POLICY "orders_insert_policy" ON orders
    FOR INSERT WITH CHECK (has_location_access(location_id, auth.uid()));

CREATE POLICY "orders_update_policy" ON orders
    FOR UPDATE USING (has_location_access(location_id, auth.uid()));

CREATE POLICY "orders_delete_policy" ON orders
    FOR DELETE USING (has_location_access(location_id, auth.uid()));
