// Environment configuration
export const env = {
  development: {
    hubUrl: import.meta.env.VITE_HUB_URL || "http://localhost:5197/gamehub",
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5197/api",
  },
  production: {
    hubUrl: import.meta.env.VITE_HUB_URL || "https://your-prod-domain/gamehub",
    apiUrl: import.meta.env.VITE_API_URL || "https://your-prod-domain/api",
  },
  test: {
    hubUrl: import.meta.env.VITE_HUB_URL || "http://localhost:5197/gamehub",
    apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5197/api",
  }
};

export const getConfig = () => {
  const environment = import.meta.env.MODE || 'development';
  return env[environment as keyof typeof env];
};