-- Fix user_invitations table schema by adding missing columns that the code expects
-- This resolves the critical database schema inconsistency identified in the audit

-- Add missing email tracking columns
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS email_provider TEXT DEFAULT 'resend';

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS email_id TEXT;

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS delivery_error TEXT;

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS last_delivery_attempt TIMESTAMP WITH TIME ZONE;

-- Update existing records to have proper delivery_status
UPDATE user_invitations 
SET delivery_status = 'delivered' 
WHERE status = 'sent' AND delivery_status IS NULL;

-- Verify the schema changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_invitations' 
ORDER BY ordinal_position;
