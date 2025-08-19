-- Insert sample retailers
INSERT INTO retailers (id, name) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Sample Retailer A'),
    ('22222222-2222-2222-2222-222222222222', 'Sample Retailer B');

-- Insert sample locations
INSERT INTO locations (id, retailer_id, name, address) VALUES 
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Store A1', '123 Main St'),
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Store A2', '456 Oak Ave'),
    ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Store B1', '789 Pine Rd');

-- Note: User roles and memberships will be created when users sign up
-- This is just sample data for retailers and locations
