-- Check the current token format for the specific invitation
SELECT 
    email,
    invitation_token,
    LENGTH(invitation_token) as token_length,
    CASE 
        WHEN invitation_token LIKE 'REGENERATE_%' THEN 'REGENERATE format'
        WHEN invitation_token ~ '^[A-Za-z0-9+/]+=*\.[A-Za-z0-9+/]+=*\.[A-Za-z0-9+/]+=*$' THEN '3-part cryptographic'
        WHEN invitation_token ~ '^[a-f0-9-]+_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
        ELSE 'Unknown format'
    END as token_format,
    status,
    expires_at,
    created_at
FROM user_invitations 
WHERE email = 'omri@iv-relife.com'
ORDER BY created_at DESC;

-- Check all current token formats in the system
SELECT 
    CASE 
        WHEN invitation_token LIKE 'REGENERATE_%' THEN 'REGENERATE format'
        WHEN invitation_token ~ '^[A-Za-z0-9+/]+=*\.[A-Za-z0-9+/]+=*\.[A-Za-z0-9+/]+=*$' THEN '3-part cryptographic'
        WHEN invitation_token ~ '^[a-f0-9-]+_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
        ELSE 'Unknown format'
    END as token_format,
    COUNT(*) as count,
    status
FROM user_invitations 
GROUP BY token_format, status
ORDER BY count DESC;
