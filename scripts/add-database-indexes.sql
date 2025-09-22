-- Adding database indexes to optimize query performance

-- Indexes for user_profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified_at);

-- Indexes for user_roles table  
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_retailer_id ON user_roles(retailer_id);

-- Indexes for user_location_memberships table
CREATE INDEX IF NOT EXISTS idx_user_location_memberships_user_id ON user_location_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_memberships_location_id ON user_location_memberships(location_id);
CREATE INDEX IF NOT EXISTS idx_user_location_memberships_is_active ON user_location_memberships(is_active);

-- Indexes for user_invitations table
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);

-- Indexes for locations table
CREATE INDEX IF NOT EXISTS idx_locations_retailer_id ON locations(retailer_id);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);

-- Indexes for retailers table
CREATE INDEX IF NOT EXISTS idx_retailers_is_active ON retailers(is_active);
CREATE INDEX IF NOT EXISTS idx_retailers_business_name ON retailers(business_name);

-- Indexes for audit_logs table (for better audit performance)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_user_location_memberships_user_active ON user_location_memberships(user_id, is_active);
