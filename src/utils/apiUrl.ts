/**
 * Resolves API and asset URLs dynamically to support both root domain deployments
 * (e.g., https://domain.com) and cPanel subfolder deployments (e.g., https://domain.com/crm or https://domain.com/solar).
 */
export const getApiUrl = (endpoint: string): string => {
  if (typeof window === 'undefined') return endpoint;
  // Get current pathname and strip trailing slashes or /index.html
  const basePath = window.location.pathname.replace(/(\/index\.html|\/)+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${basePath}${cleanEndpoint}`;
};
