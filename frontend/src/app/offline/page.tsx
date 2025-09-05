'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mx-auto mb-6 w-24 h-24">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="w-full h-full text-gray-400"
          >
            <path 
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z" 
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Status Message */}
        <div className="mb-6">
          {isOnline ? (
            <div className="text-green-600">
              <h1 className="text-2xl font-bold mb-2">Back Online!</h1>
              <p className="text-gray-600">
                Your connection has been restored. You can now continue using DocApp.
              </p>
            </div>
          ) : (
            <div className="text-gray-600">
              <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
              <p className="mb-4">
                It looks like you&apos;re not connected to the internet. Some features may not be available.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {isOnline ? (
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                While offline, you can still:
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                <Link 
                  href="/dashboard" 
                  className="block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  📊 View Dashboard
                </Link>
                
                <Link 
                  href="/patients" 
                  className="block bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  👥 Browse Patients
                </Link>
                
                <Link 
                  href="/appointments" 
                  className="block bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  📅 View Appointments
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Offline Tips */}
        {!isOnline && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
            <h3 className="font-medium text-yellow-800 mb-2">
              💡 Offline Mode Tips:
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Recently viewed data is still accessible</li>
              <li>• Changes will sync when you&apos;re back online</li>
              <li>• Check your internet connection</li>
              <li>• Try refreshing once you&apos;re connected</li>
            </ul>
          </div>
        )}

        {/* Network Status Indicator */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-600">
            {isOnline ? 'Connected' : 'No Internet Connection'}
          </span>
        </div>

        {/* Auto-refresh hint */}
        {isOnline && (
          <p className="mt-4 text-xs text-gray-500">
            This page will automatically detect when you&apos;re back online
          </p>
        )}
      </div>
    </div>
  );
}
