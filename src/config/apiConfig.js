const PROD_API_BASE_URL = 'https://api.wonder.p-e.kr';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;

  if (envUrl) {
    return envUrl;
  }

  return PROD_API_BASE_URL;
};

export const API_BASE_URL = resolveBaseUrl();
