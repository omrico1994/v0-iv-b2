-- Added database performance optimizations
-- Create additional indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_email_active 
ON public.user_profiles(email, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_role_created 
ON public.user_profiles(role, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_created 
ON public.audit_logs(user_id, action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active_expires 
ON public.user_sessions(user_id, is_active, expires_at) 
WHERE is_active = true;

-- Optimize rate limiting table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_identifier_action_window 
ON public.rate_limits(identifier, action, window_start DESC);

-- Create materialized view for user statistics (for admin dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics AS
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
  COUNT(*) FILTER (WHERE last_seen_at >= NOW() - INTERVAL '30 days') as active_users_30d,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_users
FROM public.user_profiles;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_statistics_refresh 
ON user_statistics ((1));

-- Function to refresh user statistics
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for efficient user search
CREATE OR REPLACE FUNCTION search_users(
  search_term TEXT DEFAULT '',
  role_filter TEXT DEFAULT 'all',
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    up.last_seen_at,
    up.created_at
  FROM public.user_profiles up
  WHERE 
    (search_term = '' OR 
     up.email ILIKE '%' || search_term || '%' OR 
     up.full_name ILIKE '%' || search_term || '%')
    AND (role_filter = 'all' OR up.role = role_filter)
  ORDER BY up.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for audit log cleanup (remove old logs)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable query plan caching
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Set optimal configuration for performance
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
