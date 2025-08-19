-- Remove redundant is_active field from user_roles table
ALTER TABLE user_roles DROP COLUMN IF EXISTS is_active;

-- Update audit log
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'SCHEMA_UPDATE',
    'user_roles',
    'schema_change',
    '{"change": "removed_redundant_is_active_field", "reason": "user_profiles.is_active already controls user account status"}'::jsonb
);
