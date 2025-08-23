-- Comprehensive Schema Alignment Migration
-- Fixes all identified mismatches between code expectations and database schema

-- =============================================================================
-- CRITICAL FIX: user_profiles table structure alignment
-- =============================================================================

-- The code expects user_profiles to have user_id as foreign key to auth.users(id)
-- But current schema uses id as primary key. We need to align this properly.

-- First, check if we need to fix the user_profiles structure
DO $$
BEGIN
    -- Check if user_profiles.user_id exists and is properly set up
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'user_id'
        AND is_nullable = 'NO'
    ) THEN
        -- Add user_id column if it doesn't exist or isn't properly constrained
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS user_id UUID;
        
        -- Update user_id to match id for existing records
        UPDATE user_profiles SET user_id = id WHERE user_id IS NULL;
        
        -- Make user_id NOT NULL and add foreign key constraint
        ALTER TABLE user_profiles 
        ALTER COLUMN user_id SET NOT NULL;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'user_profiles_user_id_fkey' 
            AND table_name = 'user_profiles'
        ) THEN
            ALTER TABLE user_profiles 
            ADD CONSTRAINT user_profiles_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        -- Add unique constraint on user_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'user_profiles_user_id_key' 
            AND table_name = 'user_profiles'
        ) THEN
            ALTER TABLE user_profiles 
            ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
        END IF;
    END IF;
END $$;

-- =============================================================================
-- AUTHENTICATION SECURITY COLUMNS
-- =============================================================================

-- Ensure all authentication security columns exist in user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- USER INVITATIONS EMAIL TRACKING COLUMNS
-- =============================================================================

-- Add missing email tracking columns to user_invitations
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS email_provider TEXT DEFAULT 'resend',
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS email_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_error TEXT,
ADD COLUMN IF NOT EXISTS last_delivery_attempt TIMESTAMP WITH TIME ZONE;

-- Ensure status column exists with proper constraint
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Update constraint for invitation status (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_invitation_status' 
               AND table_name = 'user_invitations') THEN
        ALTER TABLE user_invitations DROP CONSTRAINT check_invitation_status;
    END IF;
    
    ALTER TABLE user_invitations 
    ADD CONSTRAINT check_invitation_status 
    CHECK (status IN ('pending', 'sent', 'expired', 'accepted', 'revoked'));
END $$;

-- =============================================================================
-- MISSING INDEXES FOR PERFORMANCE
-- =============================================================================

-- Add performance indexes for authentication and user management
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_locked_until ON user_profiles(locked_until);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_delivery_status ON user_invitations(delivery_status);

-- =============================================================================
-- DATA CONSISTENCY FIXES
-- =============================================================================

-- Update existing invitation records to have proper delivery_status
UPDATE user_invitations 
SET delivery_status = 'delivered' 
WHERE status = 'sent' AND delivery_status IS NULL;

UPDATE user_invitations 
SET delivery_status = 'pending' 
WHERE status = 'pending' AND delivery_status IS NULL;

-- =============================================================================
-- VERIFICATION AND DOCUMENTATION
-- =============================================================================

-- Add helpful comments for documentation
COMMENT ON COLUMN user_profiles.user_id IS 'Foreign key to auth.users(id) - primary user reference';
COMMENT ON COLUMN user_profiles.email_verified_at IS 'Timestamp when user verified their email address';
COMMENT ON COLUMN user_profiles.last_login_at IS 'Timestamp of user last successful login';
COMMENT ON COLUMN user_profiles.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN user_profiles.locked_until IS 'Timestamp until when account is locked due to failed attempts';

COMMENT ON COLUMN user_invitations.email_provider IS 'Email service provider used (resend, sendgrid, etc.)';
COMMENT ON COLUMN user_invitations.delivery_status IS 'Email delivery status (pending, delivered, failed, bounced)';
COMMENT ON COLUMN user_invitations.email_id IS 'Provider-specific email ID for tracking';
COMMENT ON COLUMN user_invitations.delivery_error IS 'Error message if email delivery failed';
COMMENT ON COLUMN user_invitations.last_delivery_attempt IS 'Timestamp of last email delivery attempt';

-- Verify the schema changes
SELECT 
    'user_profiles' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('user_id', 'email_verified_at', 'last_login_at', 'failed_login_attempts', 'locked_until')
ORDER BY ordinal_position;

SELECT 
    'user_invitations' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_invitations' 
AND column_name IN ('email_provider', 'delivery_status', 'email_id', 'delivery_error', 'last_delivery_attempt', 'status')
ORDER BY ordinal_position;
