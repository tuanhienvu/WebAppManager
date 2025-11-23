const normalizeBaseUrl = (url?: string) => {
  if (!url) {
    return "";
  }

  try {
    const trimmed = url.trim();
    if (!trimmed) {
      return "";
    }

    const normalized = new URL(trimmed);
    normalized.pathname = normalized.pathname.replace(/\/+$/, "");
    normalized.search = "";
    normalized.hash = "";
    return normalized.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
};

const REMOTE_API_BASE = 'https://wamapi.vuleits.com';
const LOCAL_API_BASE = 'http://localhost:5000';

const detectDefaultApiBase = () => {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBase) {
    return envBase;
  }

  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local')
    ) {
      return LOCAL_API_BASE;
    }
  } else if (process.env.NODE_ENV !== 'production') {
    return LOCAL_API_BASE;
  }

  return REMOTE_API_BASE;
};

const API_BASE = normalizeBaseUrl(detectDefaultApiBase());

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

export const apiFetch = (path: string, init?: RequestInit) => {
  const defaultOptions: RequestInit = {
    credentials: 'include', // Important for cookies
    ...init,
  };
  return fetch(buildUrl(path), defaultOptions);
};

export const getApiBaseUrl = () => API_BASE;

/**
 * Converts a relative upload URL to an absolute URL with the API base
 * @param url - The URL to convert (e.g., "/uploads/file.png" or full URL)
 * @returns The absolute URL with API base prepended
 */
export const getUploadUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  // If it's already a full URL, return as is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  
  // If it's a relative URL starting with /uploads/, prepend API base
  if (url.startsWith('/uploads/')) {
    return `${API_BASE}${url}`;
  }
  
  // For any other relative URL, prepend API base
  return buildUrl(url);
};

