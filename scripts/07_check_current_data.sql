-- Check current data in key tables to diagnose authentication issue

-- Check if there are any user roles
SELECT 'user_roles' as table_name, COUNT(*) as record_count FROM user_roles;
SELECT * FROM user_roles LIMIT 10;

-- Check if there are any retailers
SELECT 'retailers' as table_name, COUNT(*) as record_count FROM retailers;
SELECT * FROM retailers LIMIT 10;

-- Check if there are any locations
SELECT 'locations' as table_name, COUNT(*) as record_count FROM locations;
SELECT * FROM locations LIMIT 10;

-- Check if there are any location memberships
SELECT 'user_location_memberships' as table_name, COUNT(*) as record_count FROM user_location_memberships;
SELECT * FROM user_location_memberships LIMIT 10;

-- Check auth.users to see what users exist (this will show Supabase Auth users)
SELECT 'auth_users' as table_name, COUNT(*) as record_count FROM auth.users;
SELECT id, email, created_at FROM auth.users LIMIT 10;

-- Find users in auth.users who don't have roles (this is likely the issue)
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as auth_created,
    ur.role,
    ur.retailer_id
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;
