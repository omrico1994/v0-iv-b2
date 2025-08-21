-- Check all invitation records to debug token validation issue
SELECT 
    id,
    email,
    invitation_token,
    status,
    role,
    created_at,
    expires_at,
    delivery_status,
    retailer_id
FROM user_invitations 
ORDER BY created_at DESC;

-- Check for the specific token that's failing
SELECT 
    id,
    email,
    invitation_token,
    status,
    role,
    created_at,
    expires_at,
    delivery_status
FROM user_invitations 
WHERE invitation_token = 'cb127305-bffc-4f72-9ae3-f0d2616d8421';

-- Check for the specific email
SELECT 
    id,
    email,
    invitation_token,
    status,
    role,
    created_at,
    expires_at,
    delivery_status
FROM user_invitations 
WHERE email = 'omrico1994@gmail.com';
