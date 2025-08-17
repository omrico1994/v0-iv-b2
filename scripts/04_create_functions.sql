-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Log the signup event
  INSERT INTO public.audit_logs (user_id, action, metadata)
  VALUES (
    NEW.id,
    'user_signup',
    jsonb_build_object(
      'email', NEW.email,
      'signup_method', 'email'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with stats
CREATE OR REPLACE FUNCTION public.get_user_profile_with_stats(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  profile_data JSONB;
  session_count INTEGER;
BEGIN
  -- Get user profile
  SELECT to_jsonb(up.*) INTO profile_data
  FROM public.user_profiles up
  WHERE up.id = user_uuid;
  
  -- Get active session count
  SELECT COUNT(*) INTO session_count
  FROM public.user_sessions
  WHERE user_id = user_uuid AND is_active = true AND expires_at > NOW();
  
  -- Combine data
  RETURN jsonb_build_object(
    'profile', profile_data,
    'active_sessions', session_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
