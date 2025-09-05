"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { format } from "date-fns";
import { CalendarDaysIcon, ClockIcon, UserIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { appointmentService, type AppointmentCalendar, type Appointment } from "@/lib/api/appointments";
import { doctorService, type Doctor } from "@/lib/api/doctors";
import { PatientSearch } from "@/components/ui/PatientSearch";
import { type PatientOption } from "@/lib/api/patients";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface DoctorOption {
  value: string;
  label: string;
}

const AppointmentsPage = () => {
  const router = useRouter();
  const [date, setDate] = useState<Value>(new Date());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Record<string, Record<string, Appointment[]>>>({});
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    time: '',
    phone: '',
    type: '',
    status: 'pending' as const
  });

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleAddAppointment = () => {
    setAddModalOpen(true);
  };


  const selectedDate = Array.isArray(date) ? date[0] : date;

  const fetchAppointments = () => {
    if (!selectedDate) return;
    
    console.log('🚀 Fetching appointments for:', format(selectedDate, "yyyy-MM-dd"), 'Doctor:', selectedDoctor);
    
    appointmentService
      .getAppointments({
        startDate: format(selectedDate, "yyyy-MM-dd"),
        endDate: format(selectedDate, "yyyy-MM-dd"),
        doctorId: selectedDoctor,
      })
      .then((response) => {
        console.log('🔍 Full API Response:', response);
        console.log('📋 Response Data:', response.data);
        console.log('📊 Data Length:', response.data?.length || 0);
        const updatedAppointments = response.data;
        const dateString = format(selectedDate, "yyyy-MM-dd");
        console.log('📅 Date String:', dateString);
        console.log('👨‍⚕️ Selected Doctor:', selectedDoctor);
        
        setAppointments(prev => {
          const newState = {
            ...prev,
            [selectedDoctor]: {
              ...prev[selectedDoctor],
              [dateString]: updatedAppointments,
            },
          };
          console.log('🔄 Updated Appointments State:', newState);
          return newState;
        });
      })
      .catch((error) => {
        console.error('❌ API Error:', error);
      });
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    // Only allow appointments with selected patients
    if (!selectedPatient) {
      alert('Please select a patient from the search results');
      return;
    }
    
    const patientName = selectedPatient.name;
    const phone = selectedPatient.phone;
    
    if (!newAppointment.time || !newAppointment.type) {
      alert('Please enter appointment time and type');
      return;
    }
    
    try {
      const appointmentData = {
        patientName,
        phone,
        doctorId: selectedDoctor,
        appointmentDate: format(selectedDate, "yyyy-MM-dd"),
        appointmentTime: newAppointment.time,
        appointmentType: newAppointment.type, // Map 'type' to 'appointmentType'
        notes: '',
      };

      console.log('Creating appointment with data:', appointmentData);
      console.log('🩺 Doctor ID being sent:', selectedDoctor);
      console.log('👨‍⚕️ Doctor name:', doctorOptions.find(doc => doc.value === selectedDoctor)?.label);
      await appointmentService.createAppointmentByName(appointmentData);
      
      // Refresh appointments list
      fetchAppointments();
      
      alert('Appointment created successfully!');
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert('Failed to create appointment. Please try again.');
    } finally {
      setSelectedPatient(null);
      setNewAppointment({
        patientName: '',
        time: '',
        phone: '',
        type: '',
        status: 'pending'
      });
      setAddModalOpen(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewAppointment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePatientSelect = (patient: PatientOption | null) => {
    setSelectedPatient(patient);
  };

  // Action handlers for View, Edit, Delete
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (window.confirm(`Are you sure you want to delete the appointment for ${appointment.patientName}?`)) {
      try {
        await appointmentService.deleteAppointment(appointment.id);
        fetchAppointments();
        alert('Appointment deleted successfully!');
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment. Please try again.');
      }
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      const updatedData = {
        appointmentDate: selectedAppointment.appointmentDate,
        appointmentTime: selectedAppointment.appointmentTime,
        appointmentType: selectedAppointment.appointmentType,
        status: selectedAppointment.status,
        notes: selectedAppointment.notes || '',
        consultationNotes: selectedAppointment.consultationNotes || '',
        nextAppointmentDate: selectedAppointment.nextAppointmentDate || null,
      };

      await appointmentService.updateAppointment(selectedAppointment.id, updatedData);
      fetchAppointments();
      setEditModalOpen(false);
      setSelectedAppointment(null);
      alert('Appointment updated successfully!');
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    }
  };

  const handleAppointmentChange = (field: string, value: string) => {
    if (!selectedAppointment) return;
    setSelectedAppointment(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  // Get appointments for selected doctor and date
  const getAppointmentsForDate = (selectedDate: Date): Appointment[] => {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    console.log('📅 getAppointmentsForDate - Date String:', dateString);
    console.log('👨‍⚕️ getAppointmentsForDate - Selected Doctor:', selectedDoctor);
    console.log('📋 getAppointmentsForDate - Full appointments state:', appointments);
    console.log('🔍 getAppointmentsForDate - Doctor appointments:', appointments[selectedDoctor]);
    console.log('🔍 getAppointmentsForDate - Date appointments:', appointments[selectedDoctor]?.[dateString]);
    const result = appointments[selectedDoctor]?.[dateString] || [];
    console.log('📊 getAppointmentsForDate - Result length:', result.length);
    return result;
  };

  // Get all appointment dates for selected doctor
  const getAppointmentDates = (): string[] => {
    if (!selectedDoctor) return [];
    return Object.keys(appointments[selectedDoctor] || {});
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month" && selectedDoctor) {
      const dateString = format(date, "yyyy-MM-dd");
      const appointmentDates = getAppointmentDates();
      if (appointmentDates.includes(dateString)) {
        const appointmentCount = appointments[selectedDoctor][dateString]?.length || 0;
        if (appointmentCount > 0) {
          return (
            <div className="flex justify-center" data-testid="calendar-tile-content">
              <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {appointmentCount}
              </div>
            </div>
          );
        }
      }
    }
    return null;
  };

  // Auto-load appointments when date or doctor changes
  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      console.log('🔄 useEffect triggered - fetching appointments');
      fetchAppointments();
    }
  }, [selectedDate, selectedDoctor]);

  const appointmentsForSelectedDate = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Load doctors on component mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        console.log('🚀 Loading doctors from API...');
        const fetchedDoctors = await doctorService.getDoctors();
        console.log('✅ Doctors loaded:', fetchedDoctors);
        setDoctors(fetchedDoctors);
        
        // Set the first doctor as selected if available
        if (fetchedDoctors.length > 0) {
          setSelectedDoctor(fetchedDoctors[0].id);
        }
      } catch (error) {
        console.error('❌ Error loading doctors:', error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  // Use document title for tests
  useEffect(() => {
    document.title = "Appointments - DocApp";
  }, []);

  // Convert doctors to dropdown options
  const doctorOptions: DoctorOption[] = doctors.map(doctor => ({
    value: doctor.id,
    label: doctor.displayName
  }));

  // Get selected doctor info
  const getSelectedDoctorInfo = () => {
    return doctors.find(doctor => doctor.id === selectedDoctor);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
      <PageHeader 
        title="Appointments" 
        onBack={handleBackToDashboard}
      />
      {/* Hidden h1 for accessibility tests */}
      <h1 role="heading" className="sr-only">Appointments</h1>
      
      <div className="max-w-7xl mx-auto px-4">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Doctor Selection and Calendar */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <Select
                label="Select Doctor"
                options={doctorOptions}
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                placeholder={loadingDoctors ? "Loading doctors..." : "Choose a doctor"}
                disabled={loadingDoctors}
                data-testid="react-select"
              />
            </div>

            <div className="calendar-container">
              <Calendar
                onChange={setDate}
                value={date}
                tileContent={getTileContent}
                className="w-full border-none shadow-sm"
                tileClassName="hover:bg-blue-50 transition-colors duration-200"
                data-testid="react-calendar"
              />
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </div>
                <span>Has appointments</span>
              </div>
            </div>
          </div>

          {/* Right Column - Appointments List */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Appointments for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}
                </h2>
              </div>
              {selectedDate && (
                <Button 
                  onClick={handleAddAppointment}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Appointment</span>
                </Button>
              )}
            </div>

            {appointmentsForSelectedDate.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No appointments scheduled</p>
                <p className="text-gray-400 text-sm mt-2">Select a different date or doctor to view appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointmentsForSelectedDate.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200/50 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>{appointment.appointmentTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span>Patient ID: {appointment.patientId}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {appointment.appointmentType}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewAppointment(appointment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          variant="outline"
                          size="sm"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleEditAppointment(appointment)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                          variant="outline"
                          size="sm"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteAppointment(appointment)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          variant="outline"
                          size="sm"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar {
          width: 100% !important;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          color: #1f2937;
        }
        
        .react-calendar__tile {
          position: relative;
          border-radius: 4px;
          margin: 2px;
          color: #374151 !important;
        }
        
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #dbeafe;
          color: #1f2937 !important;
        }
        
        .react-calendar__tile--active {
          background: #3b82f6 !important;
          color: white;
        }
        
        .react-calendar__tile--now {
          background: #fef3c7;
          color: #1f2937 !important;
        }
        
        .react-calendar__navigation button {
          color: #374151 !important;
          font-weight: 500;
        }
        
        .react-calendar__month-view__weekdays__weekday {
          color: #6b7280 !important;
        }
        
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6;
        }
      `}</style>

      {/* Add Appointment Modal */}
      <Modal open={isAddModalOpen} onOpenChange={setAddModalOpen} title="Add New Appointment" size="lg">
        <form onSubmit={handleSaveAppointment} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Patient Search - Full Width */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
              <PatientSearch
                value={selectedPatient}
                onSelect={handlePatientSelect}
                label="Patient"
                placeholder="Search by name, patient ID, or phone number..."
                className="bg-white/80"
                doctorId={selectedDoctor}
              />
              {selectedPatient && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <strong>Selected:</strong> {selectedPatient.name} (ID: {selectedPatient.patientId}, Phone: {selectedPatient.phone})
                </div>
              )}
            </div>
            
            
            {/* Time and Type Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                <Input
                  label="Time"
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                  className="bg-white/80"
                />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
              <Select
                label="Appointment Type"
                value={newAppointment.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                options={[
                  { label: 'Select Type', value: '' },
                  { label: 'Consultation', value: 'Consultation' },
                  { label: 'Follow-up', value: 'Follow-up' },
                  { label: 'Check-up', value: 'Check-up' },
                  { label: 'Vaccination', value: 'Vaccination' },
                  { label: 'X-ray Review', value: 'X-ray Review' },
                  { label: 'General Check-up', value: 'General Check-up' }
                ]}
                required
              />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Selected Date</label>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "No date selected"}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Doctor</label>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {doctorOptions.find(doc => doc.value === selectedDoctor)?.label || "No doctor selected"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200/50">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setAddModalOpen(false)}
              className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border-2 border-gray-300 rounded-xl font-semibold transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
            >
              Add Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Appointment Modal */}
      <Modal open={isViewModalOpen} onOpenChange={setViewModalOpen} title="View Appointment" size="lg">
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Patient Name</label>
                <p className="text-lg font-bold text-gray-900 mt-1">{selectedAppointment.patientName}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Patient ID</label>
                <p className="text-lg font-bold text-gray-900 mt-1">{selectedAppointment.patientId}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Date</label>
                <p className="text-lg font-bold text-gray-900 mt-1">{format(new Date(selectedAppointment.appointmentDate), "MMMM d, yyyy")}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Time</label>
                <p className="text-lg font-bold text-gray-900 mt-1">{selectedAppointment.appointmentTime}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Type</label>
                <p className="text-lg font-bold text-gray-900 mt-1">{selectedAppointment.appointmentType}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Status</label>
                <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{selectedAppointment.status}</p>
              </div>
            </div>
            
            {selectedAppointment.doctorName && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Doctor</label>
                <p className="text-lg font-bold text-gray-900 mt-1">{selectedAppointment.doctorName}</p>
              </div>
            )}
            
            {selectedAppointment.notes && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Notes</label>
                <p className="text-gray-900 mt-1">{selectedAppointment.notes}</p>
              </div>
            )}
            
            {selectedAppointment.consultationNotes && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-lime-50 to-green-50 border border-lime-100">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Consultation Notes</label>
                <p className="text-gray-900 mt-1">{selectedAppointment.consultationNotes}</p>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200/50">
              <Button 
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal open={isEditModalOpen} onOpenChange={setEditModalOpen} title="Edit Appointment" size="lg">
        {selectedAppointment && (
          <form onSubmit={handleUpdateAppointment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <Input
                  label="Appointment Date"
                  type="date"
                  value={selectedAppointment.appointmentDate}
                  onChange={(e) => handleAppointmentChange('appointmentDate', e.target.value)}
                  className="bg-white/80"
                />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <Input
                  label="Appointment Time"
                  type="time"
                  value={selectedAppointment.appointmentTime}
                  onChange={(e) => handleAppointmentChange('appointmentTime', e.target.value)}
                  className="bg-white/80"
                />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                <Select
                  label="Appointment Type"
                  value={selectedAppointment.appointmentType}
                  onChange={(e) => handleAppointmentChange('appointmentType', e.target.value)}
                  options={[
                    { label: 'Consultation', value: 'Consultation' },
                    { label: 'Follow-up', value: 'Follow-up' },
                    { label: 'Check-up', value: 'Check-up' },
                    { label: 'Vaccination', value: 'Vaccination' },
                    { label: 'X-ray Review', value: 'X-ray Review' },
                    { label: 'General Check-up', value: 'General Check-up' }
                  ]}
                />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                <Select
                  label="Status"
                  value={selectedAppointment.status}
                  onChange={(e) => handleAppointmentChange('status', e.target.value)}
                  options={[
                    { label: 'Scheduled', value: 'scheduled' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Missed', value: 'missed' },
                    { label: 'Cancelled', value: 'cancelled' }
                  ]}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100">
                <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={3}
                  value={selectedAppointment.notes || ''}
                  onChange={(e) => handleAppointmentChange('notes', e.target.value)}
                  placeholder="Add any notes about this appointment..."
                />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-lime-50 to-green-50 border border-lime-100">
                <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Consultation Notes</label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={3}
                  value={selectedAppointment.consultationNotes || ''}
                  onChange={(e) => handleAppointmentChange('consultationNotes', e.target.value)}
                  placeholder="Add consultation notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200/50">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border-2 border-gray-300 rounded-xl font-semibold transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
              >
                Update Appointment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AppointmentsPage;

