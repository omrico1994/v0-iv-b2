-- Test the exact query that the API is using
SELECT 
    'Direct token lookup' as test_type,
    invitation_token,
    email,
    status,
    created_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '24 hours' THEN 'VALID'
        ELSE 'EXPIRED'
    END as expiration_status
FROM user_invitations 
WHERE invitation_token = 'b6f260be-a341-4e22-82bd-9ce3fff6bf85_1755749057725'
  AND email = 'omri@iv-relife.com'
  AND status IN ('pending', 'sent');

-- Also check what statuses exist for this email
SELECT 
    'All invitations for email' as test_type,
    invitation_token,
    email,
    status,
    created_at
FROM user_invitations 
WHERE email = 'omri@iv-relife.com'
ORDER BY created_at DESC;
