-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_orders_audit ON orders;
DROP TRIGGER IF EXISTS trigger_retailers_audit ON retailers;
DROP TRIGGER IF EXISTS trigger_locations_audit ON locations;
DROP TRIGGER IF EXISTS trigger_user_roles_audit ON user_roles;
DROP TRIGGER IF EXISTS trigger_user_location_memberships_audit ON user_location_memberships;

-- Create improved audit logging function that handles different primary key structures
CREATE OR REPLACE FUNCTION fn_log_audit()
RETURNS trigger AS $$
DECLARE
    audit_user_id uuid;
    audit_action text;
    old_data_json jsonb;
    new_data_json jsonb;
    record_id_value text;
BEGIN
    -- Get the current user ID from auth context
    audit_user_id := auth.uid();
    
    -- Determine the action type
    IF TG_OP = 'DELETE' THEN
        audit_action := 'DELETE';
        old_data_json := to_jsonb(OLD);
        new_data_json := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        audit_action := 'UPDATE';
        old_data_json := to_jsonb(OLD);
        new_data_json := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        audit_action := 'INSERT';
        old_data_json := NULL;
        new_data_json := to_jsonb(NEW);
    END IF;
    
    -- Handle different primary key structures per table
    CASE TG_TABLE_NAME
        WHEN 'user_roles' THEN
            record_id_value := COALESCE((NEW.user_id)::text, (OLD.user_id)::text);
        WHEN 'user_location_memberships' THEN
            record_id_value := COALESCE(
                (NEW.user_id)::text || ',' || (NEW.location_id)::text,
                (OLD.user_id)::text || ',' || (OLD.location_id)::text
            );
        ELSE
            -- Default case for tables with 'id' column (orders, retailers, locations)
            record_id_value := COALESCE((NEW.id)::text, (OLD.id)::text);
    END CASE;
    
    -- Insert audit log entry
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        audit_user_id,
        audit_action,
        TG_TABLE_NAME,
        record_id_value,
        old_data_json,
        new_data_json
    );
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate audit triggers for all tables
CREATE TRIGGER trigger_orders_audit
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_audit();

CREATE TRIGGER trigger_retailers_audit
    AFTER INSERT OR UPDATE OR DELETE ON retailers
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_audit();

CREATE TRIGGER trigger_locations_audit
    AFTER INSERT OR UPDATE OR DELETE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_audit();

CREATE TRIGGER trigger_user_roles_audit
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_audit();

CREATE TRIGGER trigger_user_location_memberships_audit
    AFTER INSERT OR UPDATE OR DELETE ON user_location_memberships
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_audit();
