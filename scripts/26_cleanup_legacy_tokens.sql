-- Clean up any legacy UUID_TIMESTAMP format tokens from the database
-- and ensure all invitations use the new cryptographic token format

-- First, let's see what legacy tokens exist
SELECT 
    'Legacy tokens found' as check_type,
    COUNT(*) as count,
    array_agg(email) as affected_emails
FROM user_invitations 
WHERE invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$';

-- Update legacy tokens to expired status so they can't be used
UPDATE user_invitations 
SET 
    status = 'expired',
    delivery_status = 'legacy_format_deprecated',
    delivery_error = 'Token format deprecated - new invitation required'
WHERE invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$'
AND status IN ('pending', 'sent');

-- Show summary of cleanup
SELECT 
    'Cleanup summary' as result_type,
    COUNT(*) as legacy_tokens_expired
FROM user_invitations 
WHERE delivery_status = 'legacy_format_deprecated';
