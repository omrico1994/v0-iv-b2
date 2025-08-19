-- Seed sample data for testing user management system
-- This script creates sample retailers, locations, and users with different roles

-- Insert sample retailers (businesses)
INSERT INTO retailers (id, name, business_name, full_address, business_phone, business_email, website, tax_id, contact_person, created_by)
VALUES 
  (
    gen_random_uuid(),
    'techstore',
    'TechStore Solutions',
    '123 Main Street, New York, NY 10001, USA',
    '+1-555-0101',
    'contact@techstore.com',
    'https://techstore.com',
    'TAX123456789',
    'John Smith',
    (SELECT id FROM auth.users WHERE email = 'admin@iv-relife.com' LIMIT 1)
  ),
  (
    gen_random_uuid(),
    'mobileworld',
    'Mobile World Inc',
    '456 Business Ave, Los Angeles, CA 90210, USA',
    '+1-555-0202',
    'info@mobileworld.com',
    'https://mobileworld.com',
    'TAX987654321',
    'Sarah Johnson',
    (SELECT id FROM auth.users WHERE email = 'admin@iv-relife.com' LIMIT 1)
  ),
  (
    gen_random_uuid(),
    'gadgetparadise',
    'Gadget Paradise',
    '789 Tech Boulevard, Austin, TX 73301, USA',
    '+1-555-0303',
    'hello@gadgetparadise.com',
    'https://gadgetparadise.com',
    'TAX456789123',
    'Mike Davis',
    (SELECT id FROM auth.users WHERE email = 'admin@iv-relife.com' LIMIT 1)
  );

-- Insert sample locations for each retailer
WITH retailer_data AS (
  SELECT id, business_name FROM retailers WHERE business_name IN ('TechStore Solutions', 'Mobile World Inc', 'Gadget Paradise')
)
INSERT INTO locations (id, retailer_id, location_name, full_address, phone, timezone, operating_hours)
SELECT 
  gen_random_uuid(),
  r.id,
  r.business_name || ' - ' || location_info.name,
  location_info.address,
  location_info.phone,
  location_info.timezone,
  location_info.hours
FROM retailer_data r
CROSS JOIN (
  VALUES 
    ('Downtown Store', '100 Downtown Plaza, New York, NY 10005, USA', '+1-555-1001', 'America/New_York', '{"monday":{"open":"09:00","close":"18:00","closed":false},"tuesday":{"open":"09:00","close":"18:00","closed":false},"wednesday":{"open":"09:00","close":"18:00","closed":false},"thursday":{"open":"09:00","close":"18:00","closed":false},"friday":{"open":"09:00","close":"20:00","closed":false},"saturday":{"open":"10:00","close":"18:00","closed":false},"sunday":{"open":"12:00","close":"17:00","closed":false}}'::jsonb),
    ('Mall Location', '200 Shopping Center, Brooklyn, NY 11201, USA', '+1-555-1002', 'America/New_York', '{"monday":{"open":"10:00","close":"21:00","closed":false},"tuesday":{"open":"10:00","close":"21:00","closed":false},"wednesday":{"open":"10:00","close":"21:00","closed":false},"thursday":{"open":"10:00","close":"21:00","closed":false},"friday":{"open":"10:00","close":"22:00","closed":false},"saturday":{"open":"10:00","close":"22:00","closed":false},"sunday":{"open":"11:00","close":"20:00","closed":false}}'::jsonb)
) AS location_info(name, address, phone, timezone, hours)
WHERE (r.business_name = 'TechStore Solutions' AND location_info.name IN ('Downtown Store', 'Mall Location'))
   OR (r.business_name = 'Mobile World Inc' AND location_info.name = 'Downtown Store')
   OR (r.business_name = 'Gadget Paradise' AND location_info.name = 'Mall Location');

-- Create sample user profiles for different roles
-- Note: These users will need to be invited via the admin interface to set up their auth accounts

-- Sample retailer users
INSERT INTO user_profiles (id, first_name, last_name, phone, business_setup_completed)
VALUES 
  (gen_random_uuid(), 'Robert', 'Wilson', '+1-555-2001', true),
  (gen_random_uuid(), 'Lisa', 'Anderson', '+1-555-2002', true),
  (gen_random_uuid(), 'David', 'Brown', '+1-555-2003', false); -- This one needs to complete setup

-- Sample location users
INSERT INTO user_profiles (id, first_name, last_name, phone, business_setup_completed)
VALUES 
  (gen_random_uuid(), 'Emma', 'Taylor', '+1-555-3001', true),
  (gen_random_uuid(), 'James', 'Miller', '+1-555-3002', true),
  (gen_random_uuid(), 'Sophie', 'Garcia', '+1-555-3003', true),
  (gen_random_uuid(), 'Alex', 'Martinez', '+1-555-3004', true);

-- Sample office users
INSERT INTO user_profiles (id, first_name, last_name, phone, business_setup_completed)
VALUES 
  (gen_random_uuid(), 'Jennifer', 'Lee', '+1-555-4001', true),
  (gen_random_uuid(), 'Michael', 'Clark', '+1-555-4002', true);

-- Assign roles to users
WITH user_data AS (
  SELECT 
    up.id,
    up.first_name,
    up.last_name,
    r.id as retailer_id
  FROM user_profiles up
  LEFT JOIN retailers r ON (
    (up.first_name = 'Robert' AND up.last_name = 'Wilson' AND r.business_name = 'TechStore Solutions') OR
    (up.first_name = 'Lisa' AND up.last_name = 'Anderson' AND r.business_name = 'Mobile World Inc') OR
    (up.first_name = 'David' AND up.last_name = 'Brown' AND r.business_name = 'Gadget Paradise')
  )
)
INSERT INTO user_roles (id, user_id, role, retailer_id, created_by)
SELECT 
  gen_random_uuid(),
  ud.id,
  CASE 
    WHEN ud.first_name IN ('Robert', 'Lisa', 'David') THEN 'retailer'::user_role_enum
    WHEN ud.first_name IN ('Emma', 'James', 'Sophie', 'Alex') THEN 'location_user'::user_role_enum
    WHEN ud.first_name IN ('Jennifer', 'Michael') THEN 'office_user'::user_role_enum
  END,
  ud.retailer_id,
  (SELECT id FROM auth.users WHERE email = 'admin@iv-relife.com' LIMIT 1)
FROM user_data ud;

-- Assign location users to specific locations
WITH location_assignments AS (
  SELECT 
    up.id as user_id,
    l.id as location_id,
    l.retailer_id
  FROM user_profiles up
  JOIN user_roles ur ON up.id = ur.user_id
  JOIN locations l ON ur.retailer_id = l.retailer_id
  WHERE ur.role = 'location_user'
  AND (
    (up.first_name = 'Emma' AND up.last_name = 'Taylor' AND l.location_name LIKE '%Downtown Store%') OR
    (up.first_name = 'James' AND up.last_name = 'Miller' AND l.location_name LIKE '%Mall Location%') OR
    (up.first_name = 'Sophie' AND up.last_name = 'Garcia' AND l.location_name LIKE '%Downtown Store%') OR
    (up.first_name = 'Alex' AND up.last_name = 'Martinez' AND l.location_name LIKE '%Mall Location%')
  )
)
INSERT INTO user_location_memberships (id, user_id, location_id, retailer_id, created_by)
SELECT 
  gen_random_uuid(),
  la.user_id,
  la.location_id,
  la.retailer_id,
  (SELECT id FROM auth.users WHERE email = 'admin@iv-relife.com' LIMIT 1)
FROM location_assignments la;

-- Create sample user invitations (these would normally be created when admin invites users)
INSERT INTO user_invitations (id, email, role, retailer_id, invited_by, expires_at)
SELECT 
  gen_random_uuid(),
  CASE 
    WHEN up.first_name = 'Robert' THEN 'robert.wilson@techstore.com'
    WHEN up.first_name = 'Lisa' THEN 'lisa.anderson@mobileworld.com'
    WHEN up.first_name = 'David' THEN 'david.brown@gadgetparadise.com'
    WHEN up.first_name = 'Emma' THEN 'emma.taylor@techstore.com'
    WHEN up.first_name = 'James' THEN 'james.miller@mobileworld.com'
    WHEN up.first_name = 'Sophie' THEN 'sophie.garcia@gadgetparadise.com'
    WHEN up.first_name = 'Alex' THEN 'alex.martinez@techstore.com'
    WHEN up.first_name = 'Jennifer' THEN 'jennifer.lee@iv-relife.com'
    WHEN up.first_name = 'Michael' THEN 'michael.clark@iv-relife.com'
  END,
  ur.role,
  ur.retailer_id,
  (SELECT id FROM auth.users WHERE email = 'admin@iv-relife.com' LIMIT 1),
  NOW() + INTERVAL '7 days'
FROM user_profiles up
JOIN user_roles ur ON up.id = ur.user_id
WHERE up.first_name IN ('Robert', 'Lisa', 'David', 'Emma', 'James', 'Sophie', 'Alex', 'Jennifer', 'Michael');

-- Log the sample data creation
INSERT INTO audit_logs (table_name, operation, old_values, new_values, user_id)
VALUES (
  'sample_data',
  'INSERT',
  '{}',
  '{"message": "Sample data created for testing user management system", "retailers": 3, "locations": 5, "users": 9, "invitations": 9}',
  (SELECT id FROM auth.users WHERE email = 'admin@iv-relife.com' LIMIT 1)
);

-- Display summary
DO $$
BEGIN
  RAISE NOTICE 'Sample data created successfully!';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- 3 Retailers: TechStore Solutions, Mobile World Inc, Gadget Paradise';
  RAISE NOTICE '- 5 Locations across different retailers';
  RAISE NOTICE '- 9 Users with different roles (3 retailers, 4 location users, 2 office users)';
  RAISE NOTICE '- User invitations ready for email sending';
  RAISE NOTICE 'Note: David Brown (retailer) needs to complete business setup';
END $$;
