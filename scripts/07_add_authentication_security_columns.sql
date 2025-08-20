-- Add essential authentication security columns for 2025 best practices

-- Add security columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

-- Add invitation tracking columns to user_invitations table  
ALTER TABLE user_invitations
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS resent_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone DEFAULT now();

-- Fixed constraint creation syntax - removed IF NOT EXISTS which is not supported
-- Add check constraint for invitation status (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_invitation_status' 
               AND table_name = 'user_invitations') THEN
        ALTER TABLE user_invitations DROP CONSTRAINT check_invitation_status;
    END IF;
    
    -- Add the constraint
    ALTER TABLE user_invitations 
    ADD CONSTRAINT check_invitation_status 
    CHECK (status IN ('pending', 'sent', 'expired', 'accepted', 'revoked'));
END $$;

-- Update existing invitation records to have 'sent' status
UPDATE user_invitations 
SET status = 'sent', sent_at = created_at 
WHERE status IS NULL OR status = 'pending';

-- Add index for performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_locked_until ON user_profiles(locked_until);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.email_verified_at IS 'Timestamp when user verified their email address';
COMMENT ON COLUMN user_profiles.last_login_at IS 'Timestamp of user last successful login';
COMMENT ON COLUMN user_profiles.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN user_profiles.locked_until IS 'Timestamp until when account is locked due to failed attempts';

COMMENT ON COLUMN user_invitations.status IS 'Current status of invitation: pending, sent, expired, accepted, revoked';
COMMENT ON COLUMN user_invitations.resent_count IS 'Number of times invitation has been resent';
COMMENT ON COLUMN user_invitations.sent_at IS 'Timestamp when invitation was last sent';
