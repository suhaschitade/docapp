'use client';

import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show banner if app is already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      await install();
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage to persist across sessions
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-4 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="w-5 h-5 text-blue-600"
              >
                <path 
                  d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" 
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 className="font-semibold">Install DocApp</h3>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss install banner"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-5 h-5"
            >
              <path 
                d="M18 6L6 18M6 6l12 12" 
                stroke="currentColor" 
                strokeWidth={2} 
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-white/90 text-sm mb-4">
          Get quick access to your medical practice management tools with offline support.
        </p>

        {/* Benefits */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <svg 
              viewBox="0 0 16 16" 
              fill="currentColor" 
              className="w-4 h-4 text-green-300"
            >
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span className="text-white/90">Works offline</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <svg 
              viewBox="0 0 16 16" 
              fill="currentColor" 
              className="w-4 h-4 text-green-300"
            >
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span className="text-white/90">Faster loading</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <svg 
              viewBox="0 0 16 16" 
              fill="currentColor" 
              className="w-4 h-4 text-green-300"
            >
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span className="text-white/90">Native app experience</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-white text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInstalling ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Installing...</span>
              </div>
            ) : (
              'Install App'
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            Not now
          </button>
        </div>

        {/* Installation Instructions for iOS */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-xs text-white/70">
            On iOS: Tap Share → &quot;Add to Home Screen&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

// Optional: PWA Update Banner for when service worker updates are available
export function PWAUpdateBanner() {
  const { updateAvailable, updateServiceWorker } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!updateAvailable || isDismissed) {
    return null;
  }

  const handleUpdate = () => {
    updateServiceWorker();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-green-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="w-5 h-5 text-green-600"
              >
                <path 
                  d="M4 12L9 17L20 6" 
                  stroke="currentColor" 
                  strokeWidth={2} 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-semibold">Update Available</h3>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-5 h-5"
            >
              <path 
                d="M18 6L6 18M6 6l12 12" 
                stroke="currentColor" 
                strokeWidth={2} 
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-white/90 text-sm mb-3">
          A new version of DocApp is available with improvements and bug fixes.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={handleUpdate}
            className="flex-1 bg-white text-green-600 py-2 px-4 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            Update Now
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
