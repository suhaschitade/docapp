"use client";

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  MagnifyingGlassIcon,
  UserPlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Sample patient data - in real app this would come from API
const samplePatients = [
  {
    id: 1,
    patientId: 'P001',
    firstName: 'John',
    lastName: 'Doe',
    age: 45,
    gender: 'Male',
    mobileNumber: '+91 9876543210',
    email: 'john.doe@email.com',
    cancerSite: 'Lung',
    status: 'Active',
    riskLevel: 'High',
    assignedDoctorName: 'Dr. Sarah Wilson',
    registrationDate: '2024-01-15'
  },
  {
    id: 2,
    patientId: 'P002',
    firstName: 'Jane',
    lastName: 'Smith',
    age: 38,
    gender: 'Female',
    mobileNumber: '+91 9876543211',
    email: 'jane.smith@email.com',
    cancerSite: 'Breast',
    status: 'Active',
    riskLevel: 'Medium',
    assignedDoctorName: 'Dr. Michael Johnson',
    registrationDate: '2024-02-20'
  },
  {
    id: 3,
    patientId: 'P003',
    firstName: 'Robert',
    lastName: 'Johnson',
    age: 52,
    gender: 'Male',
    mobileNumber: '+91 9876543212',
    email: 'robert.j@email.com',
    cancerSite: 'Prostate',
    status: 'Follow-up',
    riskLevel: 'Low',
    assignedDoctorName: 'Dr. Emily Davis',
    registrationDate: '2024-01-28'
  }
]

export default function ManagePatientsPage() {
  const router = useRouter()
  const [isModalOpen, setModalOpen] = React.useState(false)
  const [isViewModalOpen, setViewModalOpen] = React.useState(false)
  const [isEditModalOpen, setEditModalOpen] = React.useState(false)
  const [isDeleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null)
  const [patients, setPatients] = React.useState(samplePatients)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [riskFilter, setRiskFilter] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState<any>({})
  
  const handleAddPatient = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient)
    setViewModalOpen(true)
  }

  const handleEditPatient = (patient: any) => {
    setSelectedPatient(patient)
    setEditFormData({ ...patient })
    setEditModalOpen(true)
  }

  const handleDeletePatient = (patient: any) => {
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedPatient) {
      setPatients(prevPatients => 
        prevPatients.map(p => 
          p.id === selectedPatient.id ? { ...editFormData } : p
        )
      )
      setEditModalOpen(false)
      setSelectedPatient(null)
      setEditFormData({})
    }
  }

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchTerm === '' || 
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mobileNumber.includes(searchTerm)
    
    const matchesStatus = statusFilter === '' || patient.status === statusFilter
    const matchesRisk = riskFilter === '' || patient.riskLevel === riskFilter
    
    return matchesSearch && matchesStatus && matchesRisk
  })

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
                        <div className="text-sm text-gray-900">{patient.cancerSite}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(patient.status)}`}>
                          {patient.status}
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
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Patient ID" placeholder="P004" required />
            <div></div>
            <Input label="First Name" placeholder="John" required />
            <Input label="Last Name" placeholder="Doe" required />
            <Input type="date" label="Date of Birth" required />
            <Select
              label="Gender"
              placeholder="Select Gender"
              options={[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' }
              ]}
              required
            />
            <Input label="Mobile Number" placeholder="+91 9876543210" required />
            <Input type="email" label="Email" placeholder="patient@email.com" />
            <Input label="Address" placeholder="123 Main Street" required />
            <Input label="City" placeholder="Mumbai" required />
            <Input label="State" placeholder="Maharashtra" required />
            <Input label="Postal Code" placeholder="400001" required />
            <Select
              label="Primary Cancer Site"
              placeholder="Select Cancer Site"
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
              label="Risk Level"
              placeholder="Select Risk Level"
              options={[
                { label: 'Low', value: 'Low' },
                { label: 'Medium', value: 'Medium' },
                { label: 'High', value: 'High' },
                { label: 'Critical', value: 'Critical' }
              ]}
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" variant="primary">Add Patient</Button>
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
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedPatient.cancerSite}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-100">
                  <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Status</label>
                  <div className="mt-2">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusBadgeColor(selectedPatient.status)}`}>
                      {selectedPatient.status}
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
                value={editFormData.cancerSite || ''}
                onChange={(e) => handleEditInputChange('cancerSite', e.target.value)}
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
                value={editFormData.status || ''}
                onChange={(e) => handleEditInputChange('status', e.target.value)}
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
              <Input 
                label="Assigned Doctor" 
                value={editFormData.assignedDoctorName || ''}
                onChange={(e) => handleEditInputChange('assignedDoctorName', e.target.value)}
                required 
              />
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Update Patient</Button>
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
