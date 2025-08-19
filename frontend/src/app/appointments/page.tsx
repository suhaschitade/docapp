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
import { CalendarDaysIcon, ClockIcon, UserIcon, PhoneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { appointmentService, type Appointment as ApiAppointment, type AppointmentCalendar } from "@/lib/api/appointments";
import { PatientSearch } from "@/components/ui/PatientSearch";
import { type PatientOption } from "@/lib/api/patients";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  phone: string;
  type: string;
  status: "confirmed" | "pending" | "cancelled";
}

interface DoctorOption {
  value: string;
  label: string;
}

const doctorOptions: DoctorOption[] = [
  { value: "dr_smith", label: "Dr. Smith - Cardiology" },
  { value: "dr_jones", label: "Dr. Jones - Pediatrics" },
  { value: "dr_williams", label: "Dr. Williams - General Medicine" },
  { value: "dr_brown", label: "Dr. Brown - Orthopedics" },
];

const AppointmentsPage = () => {
  const router = useRouter();
  const [date, setDate] = useState<Value>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>(doctorOptions[0].value);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [appointmentsData, setAppointmentsData] = useState<AppointmentCalendar[]>([]);
  const [appointments, setAppointments] = useState<Record<string, Record<string, Appointment[]>>>({});
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
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

  useEffect(() => {
    if (selectedDoctor) {
      appointmentService
        .getAppointmentCalendar({ doctorId: selectedDoctor })
        .then((data) => setAppointmentsData(data))
        .catch(console.error);
    }
  }, [selectedDoctor]);

  const fetchAppointments = () => {
    if (!selectedDate) return;
    appointmentService
      .getAppointments({
        startDate: format(selectedDate, "yyyy-MM-dd"),
        endDate: format(selectedDate, "yyyy-MM-dd"),
        doctorId: selectedDoctor,
      })
      .then((response) => {
        const updatedAppointments = response.data;
        const dateString = format(selectedDate, "yyyy-MM-dd");
        setAppointments(prev => ({
          ...prev,
          [selectedDoctor]: {
            ...prev[selectedDoctor],
            [dateString]: updatedAppointments,
          },
        }));
      })
      .catch(console.error);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    // Use selected patient data or fallback to manual entry
    const patientName = selectedPatient?.name || newAppointment.patientName;
    const phone = selectedPatient?.phone || newAppointment.phone;
    
    if (!patientName || !phone) {
      alert('Please select a patient or enter patient name and phone number');
      return;
    }
    
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
    if (patient) {
      // Clear manual entry fields when a patient is selected
      setNewAppointment(prev => ({
        ...prev,
        patientName: '',
        phone: ''
      }));
    }
  };

  const handleNewPatient = (name: string, phone: string) => {
    // When creating a new patient, use the CreateAppointmentByName endpoint
    // which will handle creating the patient record
    setNewAppointment(prev => ({
      ...prev,
      patientName: name,
      phone: phone
    }));
    setSelectedPatient(null);
  };

  // Get appointments for selected doctor and date
  const getAppointmentsForDate = (selectedDate: Date): Appointment[] => {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    return appointments[selectedDoctor]?.[dateString] || [];
  };

  // Get all appointment dates for selected doctor
  const getAppointmentDates = (): string[] => {
    return Object.keys(appointments[selectedDoctor] || {});
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateString = format(date, "yyyy-MM-dd");
      const appointmentDates = getAppointmentDates();
      if (appointmentDates.includes(dateString)) {
        const appointmentCount = appointments[selectedDoctor][dateString].length;
        return (
          <div className="flex justify-center">
            <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {appointmentCount}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const selectedDate = Array.isArray(date) ? date[0] : date;
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

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
      <PageHeader 
        title="Appointments" 
        onBack={handleBackToDashboard}
      />
      
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
                placeholder="Choose a doctor"
              />
            </div>

            <div className="calendar-container">
              <Calendar
                onChange={setDate}
                value={date}
                tileContent={getTileContent}
                className="w-full border-none shadow-sm"
                tileClassName="hover:bg-blue-50 transition-colors duration-200"
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
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{appointment.phone}</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {appointment.type}
                      </span>
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
                onNewPatient={handleNewPatient}
                label="Patient"
                placeholder="Search by name, patient ID, or phone number..."
                className="bg-white/80"
              />
              {selectedPatient && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <strong>Selected:</strong> {selectedPatient.name} (ID: {selectedPatient.patientId}, Phone: {selectedPatient.phone})
                </div>
              )}
            </div>
            
            {/* Manual Entry Fields - Show only if no patient selected */}
            {!selectedPatient && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
                  <Input
                    label="Patient Name (Manual Entry)"
                    placeholder="Enter patient name"
                    value={newAppointment.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    className="bg-white/80"
                  />
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <Input
                    label="Phone Number (Manual Entry)"
                    placeholder="Enter phone number"
                    value={newAppointment.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-white/80"
                  />
                </div>
              </div>
            )}
            
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
    </div>
  );
};

export default AppointmentsPage;

