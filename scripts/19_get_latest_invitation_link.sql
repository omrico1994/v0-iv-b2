-- Get the most recent pending invitation and generate the correct link
SELECT 
    email,
    invitation_token,
    status,
    created_at,
    CONCAT(
        'https://app.iv-relife.com/auth/setup-account?token=',
        invitation_token,
        '&email=',
        ENCODE(email::bytea, 'escape'),
        '&type=reset'
    ) as invitation_link
FROM user_invitations 
WHERE status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;
