"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  phoneNumber?: string;
  address?: string;
  dateJoined?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/');
      return;
    }

    const userData = authService.getUser();
    setUser(userData);
    
    // Initialize form data
    setFormData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phoneNumber: userData?.phoneNumber || '',
      address: userData?.address || ''
    });
    
    setIsLoading(false);
  }, [router]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Implement API call to save user profile
    console.log('Saving profile data:', formData);
    setIsEditing(false);
    
    // For now, just update local state
    // In a real application, you would make an API call here
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
        <div className="text-center mt-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
      <PageHeader 
        title="My Profile" 
        onBack={() => router.push('/dashboard')}
      />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="px-8 py-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="flex items-center justify-center w-20 h-20 bg-white/20 rounded-full font-bold text-2xl backdrop-blur-sm">
                {getUserInitials()}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{getUserName()}</h2>
                <div className="flex items-center space-x-4 text-blue-100">
                  <div className="flex items-center space-x-2">
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span className="font-medium">{getUserRole()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-5 w-5" />
                    <span>{user?.email || 'No email'}</span>
                  </div>
                </div>
              </div>
              
              {/* Edit Button */}
              <div className="flex-shrink-0">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 px-6 py-2"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 px-4 py-2"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="space-y-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="h-4 w-4 inline mr-2" />
                      First Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-xl">
                        {user?.firstName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon className="h-4 w-4 inline mr-2" />
                      Last Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-xl">
                        {user?.lastName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-xl">
                        {user?.email || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact & Role Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact & Role</h3>
                
                <div className="space-y-4">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PhoneIcon className="h-4 w-4 inline mr-2" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-xl">
                        {user?.phoneNumber || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPinIcon className="h-4 w-4 inline mr-2" />
                      Address
                    </label>
                    {isEditing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Enter address"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-xl">
                        {user?.address || 'Not provided'}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ShieldCheckIcon className="h-4 w-4 inline mr-2" />
                      Role
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {user?.roles?.map((role, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {role}
                        </span>
                      )) || (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date Joined */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Member Since
                    </label>
                    <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-xl">
                      {user?.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Some profile information may be managed by your system administrator. 
                  If you need to update critical information like roles or permissions, please contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
