"use client";

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { patientService, Patient } from '@/lib/api/patients'
import { doctorService, Doctor } from '@/lib/api/doctors'
import { authService } from '@/lib/auth'
import { 
  MagnifyingGlassIcon,
  UserPlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'

export default function ManagePatientsPage() {
  const router = useRouter()
  const [isModalOpen, setModalOpen] = React.useState(false)
  const [isViewModalOpen, setViewModalOpen] = React.useState(false)
  const [isEditModalOpen, setEditModalOpen] = React.useState(false)
  const [isDeleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [riskFilter, setRiskFilter] = React.useState('')
  const [cancerTypeFilter, setCancerTypeFilter] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState<Partial<Patient>>({})
  const [loading, setLoading] = React.useState(true)
  const [hasAccess, setHasAccess] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [doctors, setDoctors] = React.useState<Doctor[]>([])
  
  // Add Patient form state
  const [newPatientForm, setNewPatientForm] = React.useState({
    patientId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    mobileNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    primaryCancerSite: '',
    riskLevel: '',
  })
  
  // Load patients from API
  const loadPatients = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await patientService.searchPatients({
        search: searchTerm,
        status: statusFilter || undefined,
        riskLevel: riskFilter || undefined,
        cancerSite: cancerTypeFilter || undefined,
        pageSize: 100 // Get more patients for now
      })
      setPatients(response.data || [])
    } catch (err: unknown) {
      console.error('Error loading patients:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patients'
      console.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, riskFilter, cancerTypeFilter])
  
  // Load doctors from API
  const loadDoctors = React.useCallback(async () => {
    try {
      const doctorsData = await doctorService.getDoctors()
      setDoctors(doctorsData)
    } catch (err: unknown) {
      console.error('Error loading doctors:', err)
    }
  }, [])
  
  // Check user authentication and role-based access
  React.useEffect(() => {
    const user = authService.getUser()
    if (!user || !authService.isAuthenticated()) {
      router.push('/login')
      return
    }
    
    // Check if user has Staff or Admin role
    const userRoles = user.roles || []
    const hasStaffAccess = userRoles.some(role => ['Staff', 'Admin'].includes(role))
    
    if (!hasStaffAccess) {
      setHasAccess(false)
      return
    }
    
    setHasAccess(true)
    loadPatients()
  }, [router, loadPatients])
  
  // Reload patients when filters change
  React.useEffect(() => {
    if (hasAccess) {
      const timer = setTimeout(() => {
        loadPatients()
      }, 500) // Debounce search
      return () => clearTimeout(timer)
    }
  }, [hasAccess, loadPatients])
  
  const handleAddPatient = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    // Reset form
    setNewPatientForm({
      patientId: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      mobileNumber: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      primaryCancerSite: '',
      riskLevel: '',
    })
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setViewModalOpen(true)
  }

  const handleEditPatient = async (patient: Patient) => {
    setSelectedPatient(patient)
    setEditFormData({ ...patient })
    
    // Load doctors when opening edit modal
    await loadDoctors()
    
    setEditModalOpen(true)
  }

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (selectedPatient) {
      setPatients(prevPatients => 
        prevPatients.filter(p => p.id !== selectedPatient.id)
      )
      setDeleteModalOpen(false)
      setSelectedPatient(null)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !editFormData) return

    setIsSubmitting(true)
    
    try {
      // Prepare the data for the API call
      const updateData = {
        patientId: editFormData.patientId || selectedPatient.patientId,
        firstName: editFormData.firstName || selectedPatient.firstName,
        lastName: editFormData.lastName || selectedPatient.lastName,
        dateOfBirth: editFormData.dateOfBirth || selectedPatient.dateOfBirth,
        gender: editFormData.gender || selectedPatient.gender,
        mobileNumber: editFormData.mobileNumber || selectedPatient.mobileNumber,
        email: editFormData.email || selectedPatient.email || '',
        address: editFormData.address || selectedPatient.address || '',
        city: editFormData.city || selectedPatient.city || '',
        state: editFormData.state || selectedPatient.state || '',
        postalCode: editFormData.postalCode || selectedPatient.postalCode || '',
        country: editFormData.country || selectedPatient.country || 'India',
        emergencyContactName: editFormData.emergencyContactName || selectedPatient.emergencyContactName || '',
        emergencyContactPhone: editFormData.emergencyContactPhone || selectedPatient.emergencyContactPhone || '',
        primaryCancerSite: editFormData.primaryCancerSite || selectedPatient.primaryCancerSite,
        cancerStage: editFormData.cancerStage || selectedPatient.cancerStage || '',
        histology: editFormData.histology || selectedPatient.histology || '',
        diagnosisDate: editFormData.diagnosisDate || selectedPatient.diagnosisDate || null,
        treatmentPathway: editFormData.treatmentPathway || selectedPatient.treatmentPathway,
        currentStatus: editFormData.currentStatus || selectedPatient.currentStatus,
        riskLevel: editFormData.riskLevel || selectedPatient.riskLevel,
        assignedDoctorId: editFormData.assignedDoctorId || selectedPatient.assignedDoctorId || null,
        nextFollowupDate: editFormData.nextFollowupDate || selectedPatient.nextFollowupDate || null
      }

      console.log('🔄 Updating patient:', selectedPatient.id, 'with data:', updateData)
      
      // Call the API to update the patient
      await patientService.updatePatient(selectedPatient.id, updateData)
      
      console.log('✅ Patient updated successfully!')
      
      // Update local state with the new data
      const updatedPatient = { ...selectedPatient, ...editFormData }
      setPatients(prevPatients => 
        prevPatients.map(p => 
          p.id === selectedPatient.id ? updatedPatient : p
        )
      )
      
      // Close modal and reset form
      setEditModalOpen(false)
      setSelectedPatient(null)
      setEditFormData({})
      
      // Optionally reload patients to get fresh data from server
      await loadPatients()
      
    } catch (error) {
      console.error('❌ Error updating patient:', error)
      
      let errorMessage = 'Failed to update patient. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication required. Please log in first.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditInputChange = (field: keyof Patient, value: string | number) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNewPatientInputChange = (field: keyof typeof newPatientForm, value: string) => {
    setNewPatientForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 FORM SUBMITTED - handleAddPatientSubmit called!')
    console.log('📝 Form data:', newPatientForm)
    setIsSubmitting(true)

    try {
      // Create the patient using the API
      const newPatient = await patientService.createPatient({
        patientName: `${newPatientForm.firstName} ${newPatientForm.lastName}`,
        phone: newPatientForm.mobileNumber,
        email: newPatientForm.email,
        gender: newPatientForm.gender,
        dateOfBirth: newPatientForm.dateOfBirth,
      })

      // Add to local state immediately for better UX
      setPatients(prevPatients => [newPatient, ...prevPatients])
      
      // Close modal and reset form
      handleCloseModal()
      
      // Optionally reload patients to get the most current data
      await loadPatients()
      
      console.log('✅ Patient created successfully:', newPatient)
    } catch (error) {
      console.error('❌ Error creating patient:', error)
      
      let errorMessage = 'Failed to create patient. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication required. Please log in first.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Since API already handles filtering, we use patients directly
  // Local filtering is not needed as API handles search, status, risk, and cancer type filters
  const filteredPatients = patients

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800'
      case 'Follow-up': return 'bg-purple-100 text-purple-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Show access denied if user doesn't have permission
  if (!loading && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <ShieldExclamationIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don&apos;t have permission to access Patient Management. This feature is only available to Staff and Admin users.
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
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50">
      <PageHeader
        title="Patient Management" 
        onBack={handleBackToDashboard}
      >
        <Button 
          onClick={handleAddPatient} 
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <UserPlusIcon className="h-5 w-5" />
          <span>Add Patient</span>
        </Button>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Search and Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Search patients by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl px-4 py-2 transition-all duration-200"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Active', value: 'Active' },
                  { label: 'Follow-up', value: 'Follow-up' },
                  { label: 'Inactive', value: 'Inactive' }
                ]}
              />
              <Select
                label="Risk Level"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                options={[
                  { label: 'All Risk Levels', value: '' },
                  { label: 'High', value: 'High' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'Low', value: 'Low' }
                ]}
              />
              <Select
                label="Cancer Type"
                value={cancerTypeFilter}
                onChange={(e) => setCancerTypeFilter(e.target.value)}
                options={[
                  { label: 'All Cancer Types', value: '' },
                  { label: 'Lung', value: 'Lung' },
                  { label: 'Breast', value: 'Breast' },
                  { label: 'Prostate', value: 'Prostate' },
                  { label: 'Colorectal', value: 'Colorectal' },
                  { label: 'Other', value: 'Other' }
                ]}
              />
            </div>
          )}
        </div>

        {/* Patients List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-800">
              Patients ({filteredPatients.length})
            </h2>
          </div>
          
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No patients found matching your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cancer Site
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Doctor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.patientId} • Age: {patient.age} • {patient.gender}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.mobileNumber}</div>
                        <div className="text-sm text-gray-500">{patient.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.primaryCancerSite}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(patient.currentStatus)}`}>
                          {patient.currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeColor(patient.riskLevel)}`}>
                          {patient.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.assignedDoctorName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 text-blue-600 hover:text-blue-700"
                            onClick={() => handleViewPatient(patient)}
                            title="View Patient"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 text-green-600 hover:text-green-700"
                            onClick={() => handleEditPatient(patient)}
                            title="Edit Patient"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDeletePatient(patient)}
                            title="Delete Patient"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal open={isModalOpen} onOpenChange={setModalOpen} title="Add New Patient" size="lg">
        <form onSubmit={handleAddPatientSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Patient ID" 
              placeholder="Auto-generated" 
              value={newPatientForm.patientId}
              onChange={(e) => handleNewPatientInputChange('patientId', e.target.value)}
              disabled
            />
            <div></div>
            <Input 
              label="First Name" 
              placeholder="John" 
              value={newPatientForm.firstName}
              onChange={(e) => handleNewPatientInputChange('firstName', e.target.value)}
              required 
            />
            <Input 
              label="Last Name" 
              placeholder="Doe" 
              value={newPatientForm.lastName}
              onChange={(e) => handleNewPatientInputChange('lastName', e.target.value)}
              required 
            />
            <Input 
              type="date" 
              label="Date of Birth" 
              value={newPatientForm.dateOfBirth}
              onChange={(e) => handleNewPatientInputChange('dateOfBirth', e.target.value)}
              required 
            />
            <Select
              label="Gender"
              placeholder="Select Gender"
              value={newPatientForm.gender}
              onChange={(e) => handleNewPatientInputChange('gender', e.target.value)}
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
                { label: 'Other', value: 'Other' }
              ]}
              required
            />
            <Input 
              label="Mobile Number" 
              placeholder="+91 9876543210" 
              value={newPatientForm.mobileNumber}
              onChange={(e) => handleNewPatientInputChange('mobileNumber', e.target.value)}
              required 
            />
            <Input 
              type="email" 
              label="Email" 
              placeholder="patient@email.com" 
              value={newPatientForm.email}
              onChange={(e) => handleNewPatientInputChange('email', e.target.value)}
            />
            <Input 
              label="Address" 
              placeholder="123 Main Street" 
              value={newPatientForm.address}
              onChange={(e) => handleNewPatientInputChange('address', e.target.value)}
            />
            <Input 
              label="City" 
              placeholder="Mumbai" 
              value={newPatientForm.city}
              onChange={(e) => handleNewPatientInputChange('city', e.target.value)}
            />
            <Input 
              label="State" 
              placeholder="Maharashtra" 
              value={newPatientForm.state}
              onChange={(e) => handleNewPatientInputChange('state', e.target.value)}
            />
            <Input 
              label="Postal Code" 
              placeholder="400001" 
              value={newPatientForm.postalCode}
              onChange={(e) => handleNewPatientInputChange('postalCode', e.target.value)}
            />
            <Select
              label="Primary Cancer Site"
              placeholder="Select Cancer Site"
              value={newPatientForm.primaryCancerSite}
              onChange={(e) => handleNewPatientInputChange('primaryCancerSite', e.target.value)}
              options={[
                { label: 'Lung', value: 'Lung' },
                { label: 'Breast', value: 'Breast' },
                { label: 'Prostate', value: 'Prostate' },
                { label: 'Colorectal', value: 'Colorectal' },
                { label: 'Other', value: 'Other' }
              ]}
            />
            <Select
              label="Risk Level"
              placeholder="Select Risk Level"
              value={newPatientForm.riskLevel}
              onChange={(e) => handleNewPatientInputChange('riskLevel', e.target.value)}
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Critical', value: 'Critical' }
              ]}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button 
              variant="outline" 
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Patient Modal */}
      <Modal open={isViewModalOpen} onOpenChange={setViewModalOpen} title="Patient Details" size="lg">
        {selectedPatient && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <label className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Patient ID</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.patientId}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                  <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Full Name</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <label className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Age</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.age} years</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                  <label className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Gender</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.gender}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100">
                  <label className="text-sm font-semibold text-cyan-700 uppercase tracking-wide">Mobile Number</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.mobileNumber}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                  <label className="text-sm font-semibold text-violet-700 uppercase tracking-wide">Email</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <label className="text-sm font-semibold text-green-700 uppercase tracking-wide">Cancer Site</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.primaryCancerSite}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-100">
                  <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Status</label>
                  <div className="mt-2">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusBadgeColor(selectedPatient.currentStatus)}`}>
                      {selectedPatient.currentStatus}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
                  <label className="text-sm font-semibold text-rose-700 uppercase tracking-wide">Risk Level</label>
                  <div className="mt-2">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getRiskBadgeColor(selectedPatient.riskLevel)}`}>
                      {selectedPatient.riskLevel}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                  <label className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Assigned Doctor</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.assignedDoctorName}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                  <label className="text-sm font-semibold text-teal-700 uppercase tracking-wide">Registration Date</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{new Date(selectedPatient.registrationDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-6 border-t border-gray-200/50">
              <Button 
                variant="outline" 
                onClick={() => setViewModalOpen(false)}
                className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border-2 border-gray-300 rounded-xl font-semibold transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Patient Modal */}
      <Modal open={isEditModalOpen} onOpenChange={setEditModalOpen} title="Edit Patient" size="lg">
        {selectedPatient && (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Patient ID" 
                value={editFormData.patientId || ''}
                onChange={(e) => handleEditInputChange('patientId', e.target.value)}
                required 
              />
              <div></div>
              <Input 
                label="First Name" 
                value={editFormData.firstName || ''}
                onChange={(e) => handleEditInputChange('firstName', e.target.value)}
                required 
              />
              <Input 
                label="Last Name" 
                value={editFormData.lastName || ''}
                onChange={(e) => handleEditInputChange('lastName', e.target.value)}
                required 
              />
              <Input 
                label="Age" 
                type="number"
                value={editFormData.age || ''}
                onChange={(e) => handleEditInputChange('age', parseInt(e.target.value))}
                required 
              />
              <Select
                label="Gender"
                value={editFormData.gender || ''}
                onChange={(e) => handleEditInputChange('gender', e.target.value)}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' }
                ]}
                required
              />
              <Input 
                label="Mobile Number" 
                value={editFormData.mobileNumber || ''}
                onChange={(e) => handleEditInputChange('mobileNumber', e.target.value)}
                required 
              />
              <Input 
                type="email" 
                label="Email" 
                value={editFormData.email || ''}
                onChange={(e) => handleEditInputChange('email', e.target.value)}
              />
              <Select
                label="Primary Cancer Site"
                value={editFormData.primaryCancerSite || ''}
                onChange={(e) => handleEditInputChange('primaryCancerSite', e.target.value)}
                options={[
                  { label: 'Lung', value: 'Lung' },
                  { label: 'Breast', value: 'Breast' },
                  { label: 'Prostate', value: 'Prostate' },
                  { label: 'Colorectal', value: 'Colorectal' },
                  { label: 'Other', value: 'Other' }
                ]}
                required
              />
              <Select
                label="Status"
                value={editFormData.currentStatus || ''}
                onChange={(e) => handleEditInputChange('currentStatus', e.target.value)}
                options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Follow-up', value: 'Follow-up' },
                  { label: 'Inactive', value: 'Inactive' }
                ]}
                required
              />
              <Select
                label="Risk Level"
                value={editFormData.riskLevel || ''}
                onChange={(e) => handleEditInputChange('riskLevel', e.target.value)}
                options={[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' },
                  { label: 'Critical', value: 'Critical' }
                ]}
                required
              />
              <Select
                label="Assigned Doctor"
                value={editFormData.assignedDoctorId || ''}
                onChange={(e) => {
                  const doctorId = e.target.value
                  const selectedDoctor = doctors.find(d => d.id === doctorId)
                  handleEditInputChange('assignedDoctorId', doctorId)
                  handleEditInputChange('assignedDoctorName', selectedDoctor ? selectedDoctor.displayName : '')
                }}
                options={[
                  { label: 'Select Doctor', value: '' },
                  ...doctors.map(doctor => ({
                    label: doctor.displayName,
                    value: doctor.id
                  }))
                ]}
                placeholder="Select a doctor"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Patient'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onOpenChange={setDeleteModalOpen} title="Delete Patient" size="md">
        {selectedPatient && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-900">
                  Are you sure you want to delete <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs text-red-700">
                <strong>Warning:</strong> Deleting this patient will permanently remove all associated data including medical records, appointments, and treatment history.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete Patient</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
