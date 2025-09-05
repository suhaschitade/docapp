"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, UserIcon, PhoneIcon, CheckIcon } from '@heroicons/react/24/outline';
import { patientService, type PatientOption } from '@/lib/api/patients';

interface PatientSearchProps {
  value?: PatientOption | null;
  onSelect: (patient: PatientOption | null) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  allowNewPatient?: boolean;
  onNewPatient?: (name: string, phone: string) => void;
  doctorId?: string;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  value,
  onSelect,
  placeholder = "Search patients by name, ID, or phone...",
  label = "Patient",
  className = "",
  allowNewPatient = true,
  onNewPatient,
  doctorId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search patients when search term changes
  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.length >= 2) {
        setIsLoading(true);
        try {
          const results = await patientService.getPatientOptions(searchTerm, doctorId);
          setPatients(results);
        } catch (error) {
          console.error('Error searching patients:', error);
          setPatients([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setPatients([]);
      }
    };

    const debounceTimer = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, doctorId]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewPatientForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes
  useEffect(() => {
    if (value) {
      setSearchTerm(value.name);
    } else {
      setSearchTerm('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Clear selection if user is typing
    if (value && newValue !== value.name) {
      onSelect(null);
    }
  };

  const handlePatientSelect = (patient: PatientOption) => {
    onSelect(patient);
    setSearchTerm(patient.name);
    setIsOpen(false);
    setShowNewPatientForm(false);
  };

  const handleNewPatientClick = () => {
    setShowNewPatientForm(true);
    setNewPatientName(searchTerm);
    setNewPatientPhone('');
  };

  const handleCreateNewPatient = async () => {
    if (newPatientName.trim() && newPatientPhone.trim()) {
      try {
        console.log('Creating new patient:', { name: newPatientName.trim(), phone: newPatientPhone.trim() });
        
        // Create patient using the API
        const newPatient = await patientService.createPatient({
          patientName: newPatientName.trim(),
          phone: newPatientPhone.trim(),
        });
        
        console.log('Patient created successfully:', newPatient);
        
        // Convert to PatientOption format and select it
        const patientOption: PatientOption = {
          id: newPatient.id,
          patientId: newPatient.patientId,
          name: `${newPatient.firstName} ${newPatient.lastName}`,
          phone: newPatient.mobileNumber,
          age: newPatient.age,
        };
        
        onSelect(patientOption);
        setShowNewPatientForm(false);
        setIsOpen(false);
        setSearchTerm(patientOption.name);
        
        // If onNewPatient callback is provided, call it too
        if (onNewPatient) {
          onNewPatient(newPatientName.trim(), newPatientPhone.trim());
        }
      } catch (error) {
        console.error('Error creating patient:', error);
        alert('Failed to create patient. Please try again.');
      }
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm.length >= 2) {
      // Trigger search on focus if there's already text
      patientService.getPatientOptions(searchTerm, doctorId).then(setPatients).catch(console.error);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        {value && (
          <CheckIcon className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Searching patients...
            </div>
          )}
          
          {!isLoading && searchTerm.length < 2 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Type at least 2 characters to search
            </div>
          )}
          
          {!isLoading && searchTerm.length >= 2 && patients.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No patients found
              {allowNewPatient && (
                <button
                  onClick={handleNewPatientClick}  
                  className="block w-full mt-2 px-3 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium"
                >
                  + Create new patient &quot;{searchTerm}&quot;
                </button>
              )}
            </div>
          )}
          
          {!isLoading && patients.length > 0 && (
            <>
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {patient.patientId} • Age: {patient.age}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <PhoneIcon className="h-3 w-3" />
                      <span>{patient.phone}</span>
                    </div>
                  </div>
                </button>
              ))}
              
              {allowNewPatient && (
                <button
                  onClick={handleNewPatientClick}
                  className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 border-t border-gray-200 text-sm font-medium"
                >
                  + Create new patient
                </button>
              )}
            </>
          )}
          
          {/* New Patient Form */}
          {showNewPatientForm && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Create New Patient
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="Patient name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateNewPatient}
                    disabled={!newPatientName.trim() || !newPatientPhone.trim()}
                    className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewPatientForm(false)}
                    className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
