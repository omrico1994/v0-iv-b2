DO $$
DECLARE
    invitation_record RECORD;
    new_jwt_token TEXT;
    secret_key TEXT;
    payload_json TEXT;
    header_b64 TEXT;
    payload_b64 TEXT;
    signature_input TEXT;
    signature_b64 TEXT;
    updated_count INTEGER := 0;
BEGIN
    -- Get the JWT secret from environment variables
    secret_key := current_setting('app.jwt_secret', true);
    IF secret_key IS NULL OR secret_key = '' THEN
        RAISE EXCEPTION 'JWT secret not available in database context';
    END IF;

    RAISE NOTICE 'Starting JWT token migration...';
    
    -- Find all non-JWT tokens (legacy, REGENERATE_, and custom format tokens)
    FOR invitation_record IN 
        SELECT id, email, invitation_token, expires_at, invited_by, role
        FROM user_invitations 
        WHERE status IN ('pending', 'sent')
        AND (
            invitation_token LIKE 'REGENERATE_%' OR
            invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' OR  -- UUID_TIMESTAMP format
            (invitation_token ~ '^[a-zA-Z0-9+/]+=*\.[a-zA-Z0-9+/]+=*\.[a-f0-9]+$' AND 
             invitation_token NOT LIKE 'eyJ%')  -- Custom 3-part but not JWT
        )
    LOOP
        -- Create JWT payload
        payload_json := json_build_object(
            'email', invitation_record.email,
            'invitedBy', COALESCE(invitation_record.invited_by::text, ''),
            'type', 'invitation',
            'iat', EXTRACT(epoch FROM NOW())::integer,
            'exp', CASE 
                WHEN invitation_record.expires_at IS NOT NULL THEN 
                    EXTRACT(epoch FROM invitation_record.expires_at)::integer
                ELSE 
                    EXTRACT(epoch FROM (NOW() + INTERVAL '7 days'))::integer
            END
        )::text;

        -- Create JWT header (base64url encoded)
        header_b64 := encode(convert_to('{"alg":"HS256","typ":"JWT"}', 'UTF8'), 'base64');
        header_b64 := translate(header_b64, '+/=', '-_');
        header_b64 := rtrim(header_b64, '=');

        -- Create JWT payload (base64url encoded)
        payload_b64 := encode(convert_to(payload_json, 'UTF8'), 'base64');
        payload_b64 := translate(payload_b64, '+/=', '-_');
        payload_b64 := rtrim(payload_b64, '=');

        -- Create signature input
        signature_input := header_b64 || '.' || payload_b64;

        -- Create HMAC signature (base64url encoded)
        signature_b64 := encode(hmac(signature_input, secret_key, 'sha256'), 'base64');
        signature_b64 := translate(signature_b64, '+/=', '-_');
        signature_b64 := rtrim(signature_b64, '=');

        -- Combine into final JWT
        new_jwt_token := header_b64 || '.' || payload_b64 || '.' || signature_b64;

        -- Update the invitation record
        UPDATE user_invitations 
        SET invitation_token = new_jwt_token
        WHERE id = invitation_record.id;

        updated_count := updated_count + 1;
        
        RAISE NOTICE 'Updated invitation % (%) with JWT token', invitation_record.id, invitation_record.email;
    END LOOP;

    RAISE NOTICE 'JWT migration completed. Updated % invitation tokens.', updated_count;

    -- Show final token format summary
    RAISE NOTICE 'Final token format summary:';
    
    PERFORM 
        CASE 
            WHEN invitation_token LIKE 'eyJ%' THEN 'JWT format'
            WHEN invitation_token LIKE 'REGENERATE_%' THEN 'REGENERATE format'
            WHEN invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
            WHEN invitation_token ~ '^[a-zA-Z0-9+/]+=*\.[a-zA-Z0-9+/]+=*\.[a-f0-9]+$' THEN 'Custom 3-part'
            ELSE 'Unknown format'
        END as token_format,
        COUNT(*) as count,
        status
    FROM user_invitations 
    WHERE status IN ('pending', 'sent')
    GROUP BY 
        CASE 
            WHEN invitation_token LIKE 'eyJ%' THEN 'JWT format'
            WHEN invitation_token LIKE 'REGENERATE_%' THEN 'REGENERATE format'
            WHEN invitation_token ~ '^[a-f0-9-]{36}_[0-9]+$' THEN 'Legacy UUID_TIMESTAMP'
            WHEN invitation_token ~ '^[a-zA-Z0-9+/]+=*\.[a-zA-Z0-9+/]+=*\.[a-f0-9]+$' THEN 'Custom 3-part'
            ELSE 'Unknown format'
        END, status
    ORDER BY token_format, status;

END $$;
