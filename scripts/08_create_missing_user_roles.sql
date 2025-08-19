-- Create missing user roles for existing authenticated users
-- This fixes the "Authentication Required" issue by adding role records

-- First, create sample retailer and location data
INSERT INTO retailers (id, name, created_at, updated_at) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'IV ReLife Store', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, retailer_id, name, address, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Main Branch', '123 Main St, City', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Downtown Branch', '456 Downtown Ave, City', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create admin role for admin@iv-relife.com
INSERT INTO user_roles (user_id, role, retailer_id, created_at, updated_at)
VALUES 
  ('9afd1414-5f5f-4af2-bc3c-8c1b9d93af9a', 'admin', NULL, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  retailer_id = EXCLUDED.retailer_id,
  updated_at = NOW();

-- Create retailer role for retailer@iv-relife.com
INSERT INTO user_roles (user_id, role, retailer_id, created_at, updated_at)
VALUES 
  ('8e2d12d3-7648-4633-912e-dec6ccd2ff92', 'retailer', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  retailer_id = EXCLUDED.retailer_id,
  updated_at = NOW();

-- Create location memberships for the retailer (access to their locations)
INSERT INTO user_location_memberships (user_id, location_id, created_at)
VALUES 
  ('8e2d12d3-7648-4633-912e-dec6ccd2ff92', '550e8400-e29b-41d4-a716-446655440002', NOW()),
  ('8e2d12d3-7648-4633-912e-dec6ccd2ff92', '550e8400-e29b-41d4-a716-446655440003', NOW())
ON CONFLICT (user_id, location_id) DO NOTHING;

-- Verify the data was created correctly
SELECT 
  u.id as user_id,
  u.email,
  ur.role,
  ur.retailer_id,
  r.name as retailer_name
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN retailers r ON ur.retailer_id = r.id
ORDER BY u.email;
