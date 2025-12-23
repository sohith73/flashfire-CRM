// Base URL for API requests (Vite uses import.meta.env)
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://api.flashfirejobs.com';

// Other configuration constants can be added here
export const APP_NAME = 'FlashFire CRM';

// Add any other configuration values as needed
