-- Verify the user was created correctly
SELECT 
    up.email,
    up.first_name,
    up.last_name,
    ur.role,
    ui.status as invitation_status,
    up.setup_completed,
    up.email_verified
FROM user_profiles up
JOIN user_roles ur ON up.id = ur.user_id
JOIN user_invitations ui ON up.email = ui.email
WHERE up.email = 'YOUR_TEST_EMAIL_HERE'
ORDER BY up.created_at DESC;
