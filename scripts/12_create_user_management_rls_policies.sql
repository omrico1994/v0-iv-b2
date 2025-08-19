-- Row Level Security Policies for User Management

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'office') 
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'office') 
            AND is_active = true
        )
    );

CREATE POLICY "Retailers can view their team profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur1
            JOIN user_roles ur2 ON ur1.retailer_id = ur2.retailer_id
            WHERE ur1.user_id = auth.uid() 
            AND ur1.role = 'retailer'
            AND ur1.is_active = true
            AND ur2.user_id = user_profiles.user_id
            AND ur2.is_active = true
        )
    );

-- Documents Policies
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'office') 
            AND is_active = true
        )
    );

CREATE POLICY "Retailers can view their business documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'retailer'
            AND retailer_id = documents.retailer_id
            AND is_active = true
        )
    );

CREATE POLICY "Users can upload their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all documents" ON documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'office') 
            AND is_active = true
        )
    );

-- User Invitations Policies
CREATE POLICY "Admins can manage all invitations" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'office') 
            AND is_active = true
        )
    );

CREATE POLICY "Retailers can manage their team invitations" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'retailer'
            AND retailer_id = user_invitations.retailer_id
            AND is_active = true
        )
    );

-- Update existing policies to include soft delete checks
DROP POLICY IF EXISTS "Admins can manage all users" ON user_roles;
CREATE POLICY "Admins can manage all users" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'office') 
            AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Retailers can manage their locations" ON locations;
CREATE POLICY "Retailers can manage their locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'retailer'
            AND retailer_id = locations.retailer_id
            AND is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'office') 
            AND is_active = true
        )
    );
