-- Add missing deactivation tracking columns to user_profiles table
-- These columns are needed for the toggleUserStatus functionality

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id);

-- Add index for better query performance on deactivated users
CREATE INDEX IF NOT EXISTS idx_user_profiles_deactivated_at ON user_profiles(deactivated_at);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.deactivated_at IS 'Timestamp when the user was deactivated';
COMMENT ON COLUMN user_profiles.deactivated_by IS 'ID of the admin user who deactivated this user';
