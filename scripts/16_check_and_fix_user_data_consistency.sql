-- Check for users in user_roles but not in user_profiles
SELECT 
    ur.user_id,
    ur.role,
    au.email,
    'Missing from user_profiles' as issue
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN user_profiles up ON ur.user_id = up.user_id
WHERE up.user_id IS NULL;

-- Check for users in user_profiles but not in user_roles  
SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    'Missing from user_roles' as issue
FROM user_profiles up
LEFT JOIN user_roles ur ON up.user_id = ur.user_id
WHERE ur.user_id IS NULL;

-- Fix: Create missing user_profiles for existing user_roles
INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    phone,
    is_active,
    business_setup_completed,
    created_at,
    updated_at
)
SELECT 
    ur.user_id,
    COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(au.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    true,
    CASE WHEN ur.role = 'retailer' THEN false ELSE true END,
    NOW(),
    NOW()
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN user_profiles up ON ur.user_id = up.user_id
WHERE up.user_id IS NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_user_roles,
    COUNT(up.user_id) as matching_profiles
FROM user_roles ur
LEFT JOIN user_profiles up ON ur.user_id = up.user_id;
