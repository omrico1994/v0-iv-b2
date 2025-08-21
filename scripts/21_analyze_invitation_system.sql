-- Check current invitation records and their status
SELECT 
    id,
    email,
    invitation_token,
    status,
    role,
    created_at,
    expires_at,
    delivery_status,
    retailer_id,
    -- Check if token matches the one from the URL
    CASE 
        WHEN invitation_token LIKE '19975267-baf6-478d-b6e2-5ac19b1fe47d%' THEN 'MATCHES_URL_TOKEN'
        ELSE 'NO_MATCH'
    END as token_match
FROM user_invitations 
WHERE email = 'omrico1994@icloud.com'
ORDER BY created_at DESC;

-- Check if there are any expired invitations
SELECT 
    'Expired invitations' as check_type,
    COUNT(*) as count
FROM user_invitations 
WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- Check invitation token format patterns
SELECT 
    'Token format analysis' as check_type,
    invitation_token,
    LENGTH(invitation_token) as token_length,
    CASE 
        WHEN invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' THEN 'UUID_TIMESTAMP_FORMAT'
        WHEN invitation_token ~ '^[a-f0-9-]{36}$' THEN 'UUID_ONLY_FORMAT'
        ELSE 'OTHER_FORMAT'
    END as format_type
FROM user_invitations 
WHERE email = 'omrico1994@icloud.com';

-- Check if user already exists in auth
SELECT 
    'User existence check' as check_type,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email_verified_at,
    ur.role,
    ur.retailer_id
FROM user_profiles up
LEFT JOIN user_roles ur ON up.user_id = ur.user_id
WHERE up.user_id IN (
    SELECT user_id FROM user_profiles WHERE user_id::text IN (
        SELECT SPLIT_PART(invitation_token, '_', 1) 
        FROM user_invitations 
        WHERE email = 'omrico1994@icloud.com'
    )
);
