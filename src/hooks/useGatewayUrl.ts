import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';

export function useGatewayUrl() {
  const { selectedProject } = useProject();
  const [systemGatewayDomain, setSystemGatewayDomain] = useState<string>('');
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
        setSystemGatewayDomain(data.config_value);
      }
    } catch (error) {
      console.error('Error loading gateway config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the effective gateway domain (project-specific or system-wide)
  const getEffectiveGatewayDomain = (projectId?: string | null): string => {
    // If a specific project ID is provided, check if it has a custom domain
    if (projectId && selectedProject?.id === projectId && selectedProject.gateway_domain) {
      return selectedProject.gateway_domain;
    }

    // If currently selected project has a custom domain, use it
    if (selectedProject?.gateway_domain) {
      return selectedProject.gateway_domain;
    }

    // Otherwise use system-wide domain
    return systemGatewayDomain;
  };

  const getGatewayUrl = (integrationId: string, projectId?: string | null): string => {
    const effectiveDomain = getEffectiveGatewayDomain(projectId);

    if (effectiveDomain) {
      return `https://${effectiveDomain}/functions/v1/api-gateway/${integrationId}`;
    }
    return `${supabaseUrl}/functions/v1/api-gateway/${integrationId}`;
  };

  const getBaseGatewayUrl = (projectId?: string | null): string => {
    const effectiveDomain = getEffectiveGatewayDomain(projectId);

    if (effectiveDomain) {
      return `https://${effectiveDomain}/functions/v1/api-gateway`;
    }
    return `${supabaseUrl}/functions/v1/api-gateway`;
  };

  return {
    systemGatewayDomain,
    projectGatewayDomain: selectedProject?.gateway_domain || null,
    effectiveGatewayDomain: getEffectiveGatewayDomain(),
    loading,
    getGatewayUrl,
    getBaseGatewayUrl
  };
}
