-- Debug the specific invitation for omri@iv-relife.com that's failing validation
-- This script provides comprehensive information about the invitation status

-- 1. Check the specific failing token and email combination
SELECT 
    'Failing token check' as check_type,
    id,
    email,
    invitation_token,
    status,
    role,
    retailer_id,
    created_at,
    expires_at,
    delivery_status,
    resent_count,
    sent_at,
    -- Check expiration status
    CASE 
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRED'
        WHEN expires_at IS NULL AND created_at < NOW() - INTERVAL '7 days' THEN 'EXPIRED (no expires_at)'
        ELSE 'VALID'
    END as expiration_status,
    -- Check token format
    CASE 
        WHEN invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
        WHEN invitation_token LIKE '%.%.%' THEN 'New Cryptographic Format'
        WHEN invitation_token ~ '^[a-f0-9-]{36}$' THEN 'UUID Only'
        ELSE 'Unknown Format'
    END as token_format,
    LENGTH(invitation_token) as token_length
FROM user_invitations 
WHERE invitation_token = 'b6f260be-a341-4e22-82bd-9ce3fff6bf85_1755749057725'
   OR email = 'omri@iv-relife.com'
ORDER BY created_at DESC;

-- 2. Check if user already exists in the system by looking for auth users with matching email
SELECT 
    'User existence check' as check_type,
    au.id as auth_user_id,
    au.email as auth_email,
    au.email_confirmed_at,
    up.first_name,
    up.last_name,
    ur.role,
    ur.retailer_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email = 'omri@iv-relife.com';

-- 3. Check all invitations for this email to see if regeneration worked
SELECT 
    'All invitations for email' as check_type,
    invitation_token,
    status,
    created_at,
    expires_at,
    CASE 
        WHEN invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
        WHEN invitation_token LIKE '%.%.%' THEN 'New Cryptographic Format'
        ELSE 'Other Format'
    END as token_format,
    CASE 
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'EXPIRED'
        WHEN expires_at IS NULL AND created_at < NOW() - INTERVAL '7 days' THEN 'EXPIRED (no expires_at)'
        ELSE 'VALID'
    END as expiration_status
FROM user_invitations 
WHERE email = 'omri@iv-relife.com'
ORDER BY created_at DESC;

-- 4. Check if the regeneration script affected any records
SELECT 
    'Token format summary' as check_type,
    CASE 
        WHEN invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
        WHEN invitation_token LIKE '%.%.%' THEN 'New Cryptographic Format'
        ELSE 'Other Format'
    END as token_format,
    COUNT(*) as count,
    status
FROM user_invitations 
GROUP BY 
    CASE 
        WHEN invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
        WHEN invitation_token LIKE '%.%.%' THEN 'New Cryptographic Format'
        ELSE 'Other Format'
    END,
    status
ORDER BY token_format, status;
