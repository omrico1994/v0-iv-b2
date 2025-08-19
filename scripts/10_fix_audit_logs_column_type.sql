-- Fix the audit_logs table to handle different record ID types
-- Change record_id from uuid to text to support both single UUIDs and composite keys

ALTER TABLE audit_logs 
ALTER COLUMN record_id TYPE text;

-- Update the comment to reflect the change
COMMENT ON COLUMN audit_logs.record_id IS 'Primary key value(s) of the affected record - can be single UUID or composite key string';
