"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { appointmentService, Appointment } from '@/lib/api/appointments';
import { authService } from '@/lib/auth';
import { 
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function TodaysAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isRescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleCategory, setRescheduleCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load today's appointments
  const loadTodaysAppointments = async () => {
    try {
      setLoading(true);
      // Get current user to potentially filter by doctor
      const user = authService.getUser();
      const doctorId = user?.roles?.includes('Doctor') ? user.id : undefined;
      
      const response = await appointmentService.getTodaysAppointments(doctorId);
      setAppointments(response.data || []);
    } catch (err: unknown) {
      console.log('Error loading today&apos;s appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check user authentication and role-based access
  useEffect(() => {
    const user = authService.getUser();
    if (!user || !authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // Check if user has Doctor, Staff or Admin role
    const userRoles = user.roles || [];
    const hasAppointmentAccess = userRoles.some(role => ['Doctor', 'Staff', 'Admin'].includes(role));
    
    if (!hasAppointmentAccess) {
      setHasAccess(false);
      return;
    }
    
    setHasAccess(true);
    loadTodaysAppointments();
  }, [router]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleMarkAsDone = async (appointment: Appointment) => {
    try {
      setIsSubmitting(true);
      const updatedAppointment = {
        ...appointment,
        status: 'completed' as const,
        consultationNotes: `Appointment completed on ${new Date().toLocaleString()}`
      };
      
      await appointmentService.updateAppointment(appointment.id, updatedAppointment);
      
      // Update the status in the local state instead of removing
      setAppointments(prev => prev.map(apt => 
        apt.id === appointment.id 
          ? { ...apt, status: 'completed', consultationNotes: updatedAppointment.consultationNotes }
          : apt
      ));
      
    } catch (error) {
      console.error('Error marking appointment as done:', error);
      alert('Failed to mark appointment as completed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleForLater = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !rescheduleReason.trim()) return;

    try {
      setIsSubmitting(true);
      
      const rescheduleNotes = `Rescheduled - Category: ${rescheduleCategory}, Reason: ${rescheduleReason}. Original date: ${selectedAppointment.appointmentDate}`;
      
      const updatedAppointment = {
        ...selectedAppointment,
        status: 'rescheduled' as const,
        notes: rescheduleNotes,
        consultationNotes: rescheduleNotes
      };
      
      await appointmentService.updateAppointment(selectedAppointment.id, updatedAppointment);
      
      // Update the status in the local state instead of removing
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, status: 'rescheduled', notes: rescheduleNotes, consultationNotes: rescheduleNotes }
          : apt
      ));
      
      // Close modal and reset
      setRescheduleModalOpen(false);
      setSelectedAppointment(null);
      setRescheduleReason('');
      setRescheduleCategory('');
      
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Failed to reschedule appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeFromDateTime = (dateTime: string, time?: string) => {
    try {
      // Handle various time formats and ensure we have a valid time string
      let timeStr = time || '00:00';
      
      // If time already includes seconds, use as is. Otherwise add :00
      if (timeStr && !timeStr.includes(':')) {
        // If it's just a number (like 14 for 14:00), add :00
        timeStr = timeStr + ':00';
      } else if (timeStr && timeStr.split(':').length === 2) {
        // If it's HH:MM format, add seconds
        timeStr = timeStr + ':00';
      }
      
      // Ensure dateTime is in YYYY-MM-DD format
      const dateStr = dateTime;
      if (dateTime && !dateTime.includes('-')) {
        // If it's not in the expected format, return the time only
        const date = new Date();
        const [hours, minutes] = timeStr.split(':');
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      
      const fullDateTime = new Date(`${dateStr}T${timeStr}`);
      
      // Check if the date is valid
      if (isNaN(fullDateTime.getTime())) {
        // If date parsing fails, just format the time part
        const [hours, minutes] = timeStr.split(':');
        const timeOnly = new Date();
        timeOnly.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
        return timeOnly.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      
      return fullDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error, { dateTime, time });
      // Fallback: return the original time or a default
      return time || '12:00 AM';
    }
  };

  // Show access denied if user doesn't have permission
  if (!loading && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don&apos;t have permission to access Today&apos;s Appointments. This feature is only available to Doctors, Staff and Admin users.
            </p>
          </div>
          <Button 
            onClick={handleBackToDashboard}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <PageHeader
        title="Today's Appointments" 
        onBack={handleBackToDashboard}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-4">
        {/* Summary Stats */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Total Today</p>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => ['scheduled', 'confirmed', 'pending'].includes(apt.status.toLowerCase())).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-emerald-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.status.toLowerCase() === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Rescheduled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {appointments.filter(apt => apt.status.toLowerCase() === 'rescheduled').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200/50">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Today&apos;s Schedule ({new Date().toLocaleDateString('en-US', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })})
            </h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500">Loading today&apos;s appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No appointments scheduled for today</p>
              <p className="text-gray-400 text-sm mt-2">Take some time to relax or catch up on other tasks!</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              {appointments
                .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                .map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  {/* Mobile-first card layout */}
                  <div className="flex flex-col space-y-4">
                    {/* Header row - Time and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-lg text-gray-900">
                          {getTimeFromDateTime(appointment.appointmentDate, appointment.appointmentTime)}
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex items-start space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium text-gray-900 text-lg">{appointment.patientName}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{appointment.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Type */}
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span className="text-sm font-medium bg-purple-50 text-purple-800 px-2 py-1 rounded">
                        {appointment.appointmentType}
                      </span>
                    </div>

                    {/* Doctor Info */}
                    {appointment.doctorName && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">
                          <span className="text-emerald-600 font-medium">Dr.</span> {appointment.doctorName}
                        </span>
                      </div>
                    )}

                    {/* Notes (if present) */}
                    {appointment.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Notes:</span> {appointment.notes}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-100">
                      {appointment.status.toLowerCase() === 'completed' ? (
                        <div className="flex items-center space-x-2 text-green-600 px-3 py-2">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      ) : appointment.status.toLowerCase() === 'rescheduled' ? (
                        <div className="flex items-center space-x-2 text-yellow-600 px-3 py-2">
                          <ClockIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">Rescheduled</span>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-2 text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors"
                            onClick={() => handleMarkAsDone(appointment)}
                            disabled={isSubmitting || appointment.status.toLowerCase() === 'completed'}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">Mark Done</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 px-3 py-2 rounded-lg transition-colors"
                            onClick={() => handleScheduleForLater(appointment)}
                            disabled={isSubmitting || appointment.status.toLowerCase() === 'rescheduled'}
                          >
                            <ClockIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">Reschedule</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal open={isRescheduleModalOpen} onOpenChange={setRescheduleModalOpen} title="Reschedule Appointment" size="md">
        {selectedAppointment && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Patient Information</h3>
              <p className="text-sm text-yellow-700">
                <strong>{selectedAppointment.patientName}</strong><br />
                Scheduled for: {getTimeFromDateTime(selectedAppointment.appointmentDate, selectedAppointment.appointmentTime)}<br />
                Type: {selectedAppointment.appointmentType}
              </p>
            </div>

            <Select
              label="Reason Category"
              placeholder="Select reason category"
              value={rescheduleCategory}
              onChange={(e) => setRescheduleCategory(e.target.value)}
              options={[
                { label: 'Patient did not show up', value: 'no_show' },
                { label: 'Patient cancelled last minute', value: 'cancelled_late' },
                { label: 'Medical emergency', value: 'emergency' },
                { label: 'Weather conditions', value: 'weather' },
                { label: 'Transportation issues', value: 'transport' },
                { label: 'Other', value: 'other' }
              ]}
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Detailed Reason
              </label>
              <textarea
                placeholder="Please provide additional details..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                required
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-blue-300 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setSelectedAppointment(null);
                  setRescheduleReason('');
                  setRescheduleCategory('');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !rescheduleReason.trim() || !rescheduleCategory}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
              >
                {isSubmitting ? 'Rescheduling...' : 'Reschedule Appointment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}