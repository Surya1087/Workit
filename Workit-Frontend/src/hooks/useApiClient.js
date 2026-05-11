import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../services/apiClient';

const TOKEN_NOT_READY_MESSAGE = 'Authentication token is not ready yet. Please wait a moment and try again.';

export const useApiClient = () => {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  const [authError, setAuthError] = useState(null);
  const [isTokenReady, setIsTokenReady] = useState(false);

  const ensureToken = useCallback(async () => {
    if (!isLoaded) {
      return null;
    }

    if (!isSignedIn) {
      const message = 'You need to sign in before making authenticated requests.';
      console.warn('[api] Authenticated request attempted without a signed-in Clerk user');
      setAuthError(message);
      setIsTokenReady(false);
      return null;
    }

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        console.warn('[api] Clerk session loaded but no token was returned');
        setAuthError(TOKEN_NOT_READY_MESSAGE);
        setIsTokenReady(false);
        return null;
      }

      console.debug('[api] Clerk token ready for authenticated requests');
      setAuthError(null);
      setIsTokenReady(true);
      return token;
    } catch (error) {
      const message = error?.message || TOKEN_NOT_READY_MESSAGE;
      console.error('[api] Failed to preload Clerk token', message);
      setAuthError(message);
      setIsTokenReady(false);
      return null;
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    let cancelled = false;

    if (!isLoaded) {
      return undefined;
    }

    if (!isSignedIn) {
      setAuthError(null);
      setIsTokenReady(false);
      return undefined;
    }

    const warmToken = async () => {
      const token = await getToken({ skipCache: true }).catch((error) => {
        console.error('[api] Initial Clerk token lookup failed', error?.message || error);
        return null;
      });

      if (cancelled) {
        return;
      }

      if (token) {
        console.debug('[api] Initial Clerk token lookup succeeded');
        setAuthError(null);
        setIsTokenReady(true);
        return;
      }

      console.warn('[api] Initial Clerk token lookup returned no token');
      setAuthError(TOKEN_NOT_READY_MESSAGE);
      setIsTokenReady(false);
    };

    warmToken();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, sessionId]);

  const client = useMemo(() => {
    if (!isLoaded) return null;
    return createApiClient(getToken);
  }, [getToken, isLoaded, sessionId]);

  return { client, isLoaded, isSignedIn, isTokenReady, authError, ensureToken };
};
