import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';
import { createApiClient } from '../services/apiClient';

export const useApiClient = () => {
  const { getToken, isLoaded } = useAuth();

  const client = useMemo(() => {
    if (!isLoaded) {
      console.log('⏳ API Client: Waiting for Clerk to load...');
      return null;
    }
    
    console.log('✅ API Client: Clerk loaded, creating client...');
    return createApiClient(getToken);
  }, [getToken, isLoaded]);

  return { client, isLoaded };
};
