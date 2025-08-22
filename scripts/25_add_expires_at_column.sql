-- Add expires_at column to store explicit expiration times
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have proper expiration (24 hours from created_at)
UPDATE user_invitations 
SET expires_at = created_at + INTERVAL '24 hours'
WHERE expires_at IS NULL;

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at 
ON user_invitations(expires_at);

-- Verify the changes
SELECT invitation_token, email, created_at, expires_at, status 
FROM user_invitations 
ORDER BY created_at DESC 
LIMIT 5;
