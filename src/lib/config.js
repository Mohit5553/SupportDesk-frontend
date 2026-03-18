const DEFAULT_PRODUCTION_ORIGIN = 'https://supportdesk-backend-kn60.onrender.com';
const env = import.meta.env || {};

const isLocalHost = (value) =>
    value?.includes('localhost') || value?.includes('127.0.0.1');

const normalizeUrl = (value) => value?.replace(/\/+$/, '');

const getApiUrl = () => {
    const envUrl = normalizeUrl(env.VITE_API_URL);

    if (envUrl) {
        return envUrl;
    }

    if (env.DEV) {
        return 'http://localhost:5000/api';
    }

    return `${DEFAULT_PRODUCTION_ORIGIN}/api`;
};

const getSocketUrl = () => {
    const envUrl = normalizeUrl(env.VITE_SOCKET_URL);

    if (envUrl) {
        return envUrl;
    }

    const apiUrl = getApiUrl();

    if (apiUrl.endsWith('/api')) {
        return apiUrl.slice(0, -4);
    }

    if (isLocalHost(apiUrl) || env.DEV) {
        return 'http://localhost:5000';
    }

    return DEFAULT_PRODUCTION_ORIGIN;
};

export const API_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();
export const API_ORIGIN = SOCKET_URL;
