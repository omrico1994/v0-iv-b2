-- Regenerate invitation tokens with proper future expiration times
DO $$
DECLARE
    invitation_record RECORD;
    new_token TEXT;
    payload_data JSONB;
    current_time_ms BIGINT;
    expiration_time_ms BIGINT;
BEGIN
    -- Get current time in milliseconds
    current_time_ms := EXTRACT(EPOCH FROM NOW()) * 1000;
    -- Set expiration to 7 days from now in milliseconds
    expiration_time_ms := current_time_ms + (7 * 24 * 60 * 60 * 1000);
    
    RAISE NOTICE 'Current time (ms): %', current_time_ms;
    RAISE NOTICE 'Expiration time (ms): %', expiration_time_ms;
    
    -- Update all pending and sent invitations with new tokens
    FOR invitation_record IN 
        SELECT id, email, invited_by, invitation_token
        FROM user_invitations 
        WHERE status IN ('pending', 'sent')
        AND expires_at > NOW()
    LOOP
        -- Create payload for new token
        payload_data := jsonb_build_object(
            'email', invitation_record.email,
            'invitedBy', COALESCE(invitation_record.invited_by::text, 'system'),
            'exp', expiration_time_ms
        );
        
        -- Generate new secure token (this will be handled by the application)
        -- For now, we'll create a placeholder that the app can regenerate
        new_token := 'REGENERATE_' || invitation_record.id;
        
        -- Update the invitation record
        UPDATE user_invitations 
        SET invitation_token = new_token,
            expires_at = TO_TIMESTAMP(expiration_time_ms / 1000)
        WHERE id = invitation_record.id;
        
        RAISE NOTICE 'Updated invitation % with new expiration: %', 
            invitation_record.email, TO_TIMESTAMP(expiration_time_ms / 1000);
    END LOOP;
    
    -- Show summary
    RAISE NOTICE 'Regenerated tokens for % invitations', 
        (SELECT COUNT(*) FROM user_invitations WHERE invitation_token LIKE 'REGENERATE_%');
END $$;
