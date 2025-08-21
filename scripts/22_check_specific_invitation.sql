-- Check the specific invitation that's failing
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
    -- Check if it's expired (older than 24 hours)
    CASE 
        WHEN created_at < NOW() - INTERVAL '24 hours' THEN 'EXPIRED'
        ELSE 'VALID'
    END as expiration_status
FROM user_invitations 
WHERE invitation_token = 'b6f260be-a341-4e22-82bd-9ce3fff6bf85_1755749057725'
   OR email = 'omri@iv-relife.com'
ORDER BY created_at DESC;

-- Also check if there are any other invitations for this email
SELECT 
    'All invitations for this email' as check_type,
    invitation_token,
    status,
    created_at,
    CASE 
        WHEN created_at < NOW() - INTERVAL '24 hours' THEN 'EXPIRED'
        ELSE 'VALID'
    END as expiration_status
FROM user_invitations 
WHERE email = 'omri@iv-relife.com'
ORDER BY created_at DESC;
