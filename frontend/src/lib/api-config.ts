/**
 * Dynamic API Configuration
 * Handles different API base URLs based on how the app is accessed
 */

export function getApiBaseUrl(): string {
  // Get the configured base URL from environment
  const envApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  // If we have an environment variable, use it
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback: Dynamic detection based on current host
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // If accessing via localhost, use localhost for API
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:5145/api';
    }
    
    // If accessing via network IP, use the same IP for API (assuming backend is on same machine)
    if (currentHost.startsWith('192.168.') || currentHost.startsWith('10.') || currentHost.startsWith('172.')) {
      return `http://${currentHost}:5145/api`;
    }
  }
  
  // Default fallback
  return 'http://localhost:5145/api';
}

// Export a configured API base URL
export const API_BASE_URL = getApiBaseUrl();

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 API Base URL configured:', API_BASE_URL);
  if (typeof window !== 'undefined') {
    console.log('🔍 Current hostname:', window.location.hostname);
  }
}