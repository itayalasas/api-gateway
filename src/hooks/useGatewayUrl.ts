import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useGatewayUrl() {
  const [gatewayDomain, setGatewayDomain] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    loadGatewayConfig();
  }, []);

  const loadGatewayConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'gateway_domain')
        .maybeSingle();

      if (data?.config_value) {
        setGatewayDomain(data.config_value);
      }
    } catch (error) {
      console.error('Error loading gateway config:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGatewayUrl = (integrationId: string): string => {
    if (gatewayDomain) {
      return `https://${gatewayDomain}/functions/v1/api-gateway/${integrationId}`;
    }
    return `${supabaseUrl}/functions/v1/api-gateway/${integrationId}`;
  };

  const getBaseGatewayUrl = (): string => {
    if (gatewayDomain) {
      return `https://${gatewayDomain}/functions/v1/api-gateway`;
    }
    return `${supabaseUrl}/functions/v1/api-gateway`;
  };

  return {
    gatewayDomain,
    loading,
    getGatewayUrl,
    getBaseGatewayUrl
  };
}
