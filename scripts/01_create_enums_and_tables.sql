-- Create user role type enum
CREATE TYPE user_role_type AS ENUM ('admin', 'office', 'retailer', 'location_user');

-- Create retailers table (referenced by user_roles and locations)
CREATE TABLE retailers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create locations table (belongs to retailers)
CREATE TABLE locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id uuid NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE user_roles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    retailer_id uuid REFERENCES retailers(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Constraint: admin/office roles cannot have retailer_id
    CONSTRAINT check_admin_office_no_retailer 
        CHECK ((role IN ('admin', 'office') AND retailer_id IS NULL) OR 
               (role IN ('retailer', 'location_user') AND retailer_id IS NOT NULL))
);

-- Create user_location_memberships table
CREATE TABLE user_location_memberships (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, location_id)
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    order_number text NOT NULL UNIQUE,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    status text DEFAULT 'pending',
    total_amount decimal(10,2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_retailer_id ON user_roles(retailer_id);
CREATE INDEX idx_locations_retailer_id ON locations(retailer_id);
CREATE INDEX idx_user_location_memberships_user_id ON user_location_memberships(user_id);
CREATE INDEX idx_user_location_memberships_location_id ON user_location_memberships(location_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_orders_location_id ON orders(location_id);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Generate short UUID function for order numbers
CREATE OR REPLACE FUNCTION generate_short_uuid()
RETURNS text AS $$
BEGIN
    RETURN UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Set default order number generation
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT generate_short_uuid();
