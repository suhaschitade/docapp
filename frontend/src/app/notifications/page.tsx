"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { notificationService, Notification } from '@/lib/api/notifications';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    isRead: undefined as boolean | undefined,
    notificationType: '',
    priority: '',
    searchTerm: ''
  });

  const pageSize = 10;

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        pageSize,
      };

      if (filters.isRead !== undefined) params.isRead = filters.isRead;
      if (filters.notificationType) params.notificationType = filters.notificationType;
      
      const response = await notificationService.getNotifications(params);
      
      let filteredData = response.data;
      
      // Apply client-side filtering for search and priority
      if (filters.searchTerm) {
        filteredData = filteredData.filter(n => 
          n.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          (n.patientName && n.patientName.toLowerCase().includes(filters.searchTerm.toLowerCase()))
        );
      }
      
      if (filters.priority) {
        filteredData = filteredData.filter(n => n.priority.toLowerCase() === filters.priority.toLowerCase());
      }
      
      setNotifications(filteredData);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/');
      return;
    }
    fetchNotifications();
  }, [currentPage, filters, router, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleMarkAsRead = async (notificationIds: number[]) => {
    try {
      await Promise.all(notificationIds.map(id => notificationService.markAsRead(id)));
      setNotifications(prev => 
        prev.map(n => notificationIds.includes(n.id) ? { ...n, isRead: true } : n)
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationIds: number[]) => {
    if (confirm('Are you sure you want to delete the selected notifications?')) {
      try {
        await Promise.all(notificationIds.map(id => notificationService.deleteNotification(id)));
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        setSelectedNotifications([]);
      } catch (error) {
        console.error('Failed to delete notifications:', error);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading && notifications.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
        <div className="text-center mt-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
      <PageHeader 
        title="Notifications" 
        onBack={() => router.push('/dashboard')}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {unreadCount} unread of {totalCount} total
          </span>
        </div>
      </PageHeader>

      <div className="max-w-6xl mx-auto">
        {/* Filters and Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-2 space-y-2 lg:space-y-0">
              <select
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                value={filters.isRead === undefined ? '' : filters.isRead.toString()}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  isRead: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
              >
                <option value="">All Status</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                value={filters.notificationType}
                onChange={(e) => setFilters(prev => ({ ...prev, notificationType: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="missed_appointment">Missed Appointment</option>
                <option value="followup_due">Follow-up Due</option>
                <option value="investigation_due">Investigation Due</option>
                <option value="treatment_reminder">Treatment Reminder</option>
                <option value="system_alert">System Alert</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {selectedNotifications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleMarkAsRead(selectedNotifications)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Mark Read ({selectedNotifications.length})
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedNotifications)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete ({selectedNotifications.length})
                  </Button>
                </div>
              )}
              
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">
                  {notifications.length === 0 ? 'No notifications' : `${notifications.length} notifications`}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No notifications found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-150 ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(prev => [...prev, notification.id]);
                        } else {
                          setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                        }
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex-shrink-0 text-2xl">
                      {notificationService.getNotificationIcon(notification.notificationType)}
                    </div>
                    
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${!notification.isRead ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          
                          {notification.patientName && (
                            <p className="text-sm text-blue-600 mt-1">
                              Patient: {notification.patientName} {notification.patientIdCode && `(${notification.patientIdCode})`}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${notificationService.getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${notificationService.getTypeColor(notification.notificationType)}`}>
                                {notificationService.formatNotificationType(notification.notificationType)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              {!notification.isRead ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                              <span>{formatDateTime(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="ghost"
                    className="px-3 py-1"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="ghost"
                    className="px-3 py-1"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
