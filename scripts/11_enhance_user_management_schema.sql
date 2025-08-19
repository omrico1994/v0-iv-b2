-- Enhanced User Management Schema
-- Adds fields for comprehensive user management, business setup, and audit logging

-- Add new columns to existing users table (via auth.users metadata)
-- We'll use the user_metadata jsonb field in auth.users for additional user info

-- Enhance retailers table with business information
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS full_address TEXT;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Enhance locations table with timezone and operating hours
ALTER TABLE locations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update locations table to use full_address instead of address
ALTER TABLE locations RENAME COLUMN address TO full_address;

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    profile_photo_url TEXT,
    business_setup_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create documents table for file storage
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    retailer_id UUID REFERENCES retailers(id),
    location_id UUID REFERENCES locations(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    document_type TEXT, -- 'profile_photo', 'business_license', 'contract', etc.
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_invitations table to track invitation status
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    retailer_id UUID REFERENCES retailers(id),
    invited_by UUID REFERENCES auth.users(id),
    invitation_token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, retailer_id)
);

-- Add soft delete to user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add soft delete to user_location_memberships  
ALTER TABLE user_location_memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_retailer_id ON documents(retailer_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_retailers_created_by ON retailers(created_by);
CREATE INDEX IF NOT EXISTS idx_retailers_active ON retailers(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing audit trigger to handle new tables
DROP TRIGGER IF EXISTS audit_user_profiles ON user_profiles;
CREATE TRIGGER audit_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION fn_log_audit();

DROP TRIGGER IF EXISTS audit_documents ON documents;
CREATE TRIGGER audit_documents
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION fn_log_audit();

DROP TRIGGER IF EXISTS audit_user_invitations ON user_invitations;
CREATE TRIGGER audit_user_invitations
    AFTER INSERT OR UPDATE OR DELETE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION fn_log_audit();
