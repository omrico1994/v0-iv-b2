-- Create constraint function to ensure user's retailer matches location's retailer
CREATE OR REPLACE FUNCTION check_user_location_retailer_match()
RETURNS trigger AS $$
BEGIN
    -- Check if the user's retailer_id matches the location's retailer_id
    IF NOT EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN locations l ON l.id = NEW.location_id
        WHERE ur.user_id = NEW.user_id 
        AND ur.retailer_id = l.retailer_id
        AND ur.role IN ('retailer', 'location_user')
    ) THEN
        RAISE EXCEPTION 'User retailer must match location retailer';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_location_memberships
CREATE TRIGGER trigger_check_user_location_retailer_match
    BEFORE INSERT OR UPDATE ON user_location_memberships
    FOR EACH ROW
    EXECUTE FUNCTION check_user_location_retailer_match();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_retailers_updated_at
    BEFORE UPDATE ON retailers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
