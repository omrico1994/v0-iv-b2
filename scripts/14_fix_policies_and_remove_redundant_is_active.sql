-- Fix RLS policies and remove redundant is_active column from user_roles
-- This script handles the dependency issues by dropping and recreating policies

-- First, drop all policies that depend on user_roles.is_active
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Retailers can view their team profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Retailers can view their business documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all invitations" ON user_invitations;
DROP POLICY IF EXISTS "Retailers can manage their team invitations" ON user_invitations;
DROP POLICY IF EXISTS "Admins can manage all users" ON user_roles;
DROP POLICY IF EXISTS "Retailers can manage their locations" ON locations;

-- Now we can safely drop the redundant is_active column from user_roles
ALTER TABLE user_roles DROP COLUMN IF EXISTS is_active;

-- Recreate the policies using user_profiles.is_active instead
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'office')
            AND up.is_active = true
        )
    );

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'office')
            AND up.is_active = true
        )
    );

CREATE POLICY "Retailers can view their team profiles" ON user_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur1
            JOIN user_profiles up1 ON ur1.user_id = up1.user_id
            JOIN user_roles ur2 ON ur2.retailer_id = ur1.retailer_id
            WHERE ur1.user_id = auth.uid() 
            AND ur1.role = 'retailer'
            AND ur2.user_id = user_profiles.user_id
            AND up1.is_active = true
            AND user_profiles.is_active = true
        )
    );

CREATE POLICY "Admins can view all documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'office')
            AND up.is_active = true
        )
    );

CREATE POLICY "Retailers can view their business documents" ON documents
    FOR SELECT USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'retailer'
            AND ur.retailer_id = documents.retailer_id
            AND up.is_active = true
        )
    );

CREATE POLICY "Admins can manage all documents" ON documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'office')
            AND up.is_active = true
        )
    );

CREATE POLICY "Admins can manage all invitations" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'office')
            AND up.is_active = true
        )
    );

CREATE POLICY "Retailers can manage their team invitations" ON user_invitations
    FOR ALL USING (
        invited_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'retailer'
            AND ur.retailer_id = user_invitations.retailer_id
            AND up.is_active = true
        )
    );

CREATE POLICY "Admins can manage all users" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'office')
            AND up.is_active = true
        )
    );

CREATE POLICY "Retailers can manage their locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN user_profiles up ON ur.user_id = up.user_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'retailer'
            AND ur.retailer_id = locations.retailer_id
            AND up.is_active = true
        )
    );
