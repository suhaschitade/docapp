"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { authService } from '@/lib/auth';
import { Portal } from './Portal';

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
}

interface UserProfileDropdownProps {
  className?: string;
}

export function UserProfileDropdown({ className = '' }: UserProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get user data on component mount
  useEffect(() => {
    const userData = authService.getUser();
    setUser(userData);
  }, []);

  // Generate user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Get user full name
  const getUserName = () => {
    if (!user) return 'User';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    return 'User';
  };

  // Get primary user role
  const getUserRole = () => {
    if (!user || !user.roles || user.roles.length === 0) return 'User';
    
    // Priority order for displaying roles
    const rolePriority = ['Admin', 'Doctor', 'Nurse', 'Staff'];
    
    for (const role of rolePriority) {
      if (user.roles.includes(role)) {
        return role;
      }
    }
    
    return user.roles[0];
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  const handleLogout = () => {
    setIsOpen(false);
    authService.logout();
    router.push('/');
  };

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right
      });
    }
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full font-semibold text-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        aria-label={`Profile menu for ${getUserName()}`}
      >
        {getUserInitials()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Portal>
          <div 
            ref={dropdownRef}
            className="w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden" 
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              right: dropdownPosition.right,
              zIndex: 999999
            }}
          >
          {/* User Info Header */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full font-semibold">
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {getUserName()}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {user?.email || 'No email'}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  {getUserRole()}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile Option */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
            >
              <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
              <div className="flex-1 text-left">
                <p className="font-medium">Profile</p>
                <p className="text-xs text-gray-500">View and edit your profile</p>
              </div>
            </button>

            {/* Divider */}
            <hr className="my-2 border-gray-100" />

            {/* Logout Option */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-red-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Sign out</p>
                <p className="text-xs text-red-400">Sign out of your account</p>
              </div>
            </button>
          </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
