const CORRECT_PASSWORD = 'flashfire@2025';
const AUTH_TOKEN_KEY = 'flashfire_crm_auth_token';

export const checkAuth = (): boolean => {
  return sessionStorage.getItem(AUTH_TOKEN_KEY) === 'true';
};

export const setAuth = (): void => {
  sessionStorage.setItem(AUTH_TOKEN_KEY, 'true');
};

export const clearAuth = (): void => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
};

export const verifyPassword = (password: string): boolean => {
  return password === CORRECT_PASSWORD;
};

export const authenticate = (password: string): boolean => {
  if (verifyPassword(password)) {
    setAuth();
    return true;
  }
  return false;
};

