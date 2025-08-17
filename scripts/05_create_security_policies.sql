-- Additional security policies and constraints

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  action TEXT NOT NULL, -- login_attempt, signup_attempt, etc.
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean up old entries
  DELETE FROM public.rate_limits 
  WHERE window_start < (NOW() - '1 hour'::INTERVAL);
  
  -- Count attempts in current window
  SELECT COALESCE(SUM(count), 0) INTO attempt_count
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND action = p_action 
    AND window_start > (NOW() - (p_window_minutes || ' minutes')::INTERVAL);
  
  -- If under limit, record this attempt
  IF attempt_count < p_max_attempts THEN
    INSERT INTO public.rate_limits (identifier, action)
    VALUES (p_identifier, p_action)
    ON CONFLICT (identifier, action) 
    DO UPDATE SET 
      count = rate_limits.count + 1,
      created_at = NOW();
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create password history table to prevent reuse
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);

-- Enable RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users cannot view password history" ON public.password_history
  FOR SELECT USING (false); -- No one can select from this table directly
