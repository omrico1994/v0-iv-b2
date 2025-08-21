-- Generate the correct invitation link for the pending invitation
SELECT 
    email,
    invitation_token,
    status,
    CONCAT(
        'https://app.iv-relife.com/auth/setup-account?token=',
        invitation_token,
        '&email=',
        REPLACE(email, '@', '%40'),
        '&type=reset'
    ) as correct_invitation_link
FROM user_invitations 
WHERE email = 'omrico1994@icloud.com' 
AND status = 'pending';

-- Also show what the current wrong link looks like vs correct format
SELECT 
    'WRONG LINK (what you''re using)' as link_type,
    'https://app.iv-relife.com/auth/setup-account?token=cb127305-bffc-4f72-9ae3-f0d2616d8421&email=omrico1994%40gmail.com&type=reset' as link
UNION ALL
SELECT 
    'CORRECT LINK (what you should use)' as link_type,
    CONCAT(
        'https://app.iv-relife.com/auth/setup-account?token=',
        invitation_token,
        '&email=',
        REPLACE(email, '@', '%40'),
        '&type=reset'
    ) as link
FROM user_invitations 
WHERE email = 'omrico1994@icloud.com' 
AND status = 'pending';
