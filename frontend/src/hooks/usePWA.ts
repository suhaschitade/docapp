'use client';

import { useEffect, useState } from 'react';

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAReturn {
  isSupported: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  install: () => Promise<void>;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  updateServiceWorker: () => void;
}

export function usePWA(): UsePWAReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if PWA is supported
    if (typeof window !== 'undefined') {
      setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
      setIsOnline(navigator.onLine);
      
      // Check if app is already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        setServiceWorkerRegistration(registration);
        console.log('Service Worker registered successfully:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Check for updates on page load
        if (registration.waiting) {
          setUpdateAvailable(true);
        }

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as PWAInstallPrompt);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('PWA installed successfully');
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSupported]);

  const install = async () => {
    if (!installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during installation:', error);
      throw error;
    }
  };

  const updateServiceWorker = () => {
    if (!serviceWorkerRegistration?.waiting) return;

    // Send message to service worker to skip waiting
    serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page to activate the new service worker
    window.location.reload();
  };

  return {
    isSupported,
    isInstalled,
    isInstallable,
    isOnline,
    install,
    serviceWorkerRegistration,
    updateAvailable,
    updateServiceWorker
  };
}

// Helper hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribe = async (serviceWorkerRegistration: ServiceWorkerRegistration) => {
    if (!isSupported || permission !== 'granted') {
      throw new Error('Push notifications permission required');
    }

    try {
      // You would typically get this VAPID key from your backend
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      
      const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      setSubscription(pushSubscription);
      
      // Send subscription to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushSubscription)
      });

      return pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      
      // Notify backend of unsubscription
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      setSubscription(null);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
}

// Helper hook for offline data management
export function useOfflineData<T>(key: string, fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch fresh data
        const freshData = await fetchFn();
        setData(freshData);
        setIsOffline(false);

        // Cache the data locally
        localStorage.setItem(`offline_${key}`, JSON.stringify(freshData));
      } catch {
        console.log('Network request failed, trying cache...');
        
        // Try to load from cache
        const cached = localStorage.getItem(`offline_${key}`);
        if (cached) {
          setData(JSON.parse(cached));
          setIsOffline(true);
        } else {
          setError('Data not available offline');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, fetchFn]);

  const refetch = async () => {
    try {
      setLoading(true);
      const freshData = await fetchFn();
      setData(freshData);
      setIsOffline(false);
      localStorage.setItem(`offline_${key}`, JSON.stringify(freshData));
    } catch (err) {
      console.error('Refetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    isOffline,
    refetch
  };
}
