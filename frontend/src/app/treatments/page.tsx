"use client";

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { treatmentService, Treatment, CreateTreatmentDto } from '@/lib/api/treatments'
import { patientService } from '@/lib/api/patients'
import { authService } from '@/lib/auth'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

interface PatientOption {
  id: number;
  patientId: string;
  name: string;
  phone: string;
  age: number;
}

export default function TreatmentsPage() {
  const router = useRouter()
  const [treatments, setTreatments] = React.useState<Treatment[]>([])
  const [patients, setPatients] = React.useState<PatientOption[]>([])
  const [selectedTreatment, setSelectedTreatment] = React.useState<Treatment | null>(null)
  
  // Modal states
  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false)
  const [isViewModalOpen, setViewModalOpen] = React.useState(false)
  const [isEditModalOpen, setEditModalOpen] = React.useState(false)
  const [isDeleteModalOpen, setDeleteModalOpen] = React.useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = React.useState('')
  const [treatmentTypeFilter, setTreatmentTypeFilter] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [patientFilter, setPatientFilter] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)
  
  // Form states
  const [formData, setFormData] = React.useState<CreateTreatmentDto>({
    patientId: 0,
    treatmentType: '',
    treatmentName: '',
    startDate: '',
    endDate: '',
    dosage: '',
    frequency: '',
    status: 'active',
    sideEffects: '',
    response: ''
  })
  
  const [loading, setLoading] = React.useState(true)
  const [hasAccess, setHasAccess] = React.useState(false)

  // Load treatments
  const loadTreatments = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await treatmentService.getTreatments({
        search: searchTerm || undefined,
        treatmentType: treatmentTypeFilter || undefined,
        status: statusFilter || undefined,
        patientId: patientFilter ? parseInt(patientFilter) : undefined,
        pageSize: 100
      })
      setTreatments(response.data || [])
    } catch (err: unknown) {
      console.error('Error loading treatments:', err)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, treatmentTypeFilter, statusFilter, patientFilter])

  // Load patients for dropdown
  const loadPatients = React.useCallback(async () => {
    try {
      const patientOptions = await patientService.getPatientOptions()
      setPatients(patientOptions)
    } catch (err: unknown) {
      console.error('Error loading patients:', err)
    }
  }, [])

  // Check authentication and authorization
  React.useEffect(() => {
    const user = authService.getUser()
    if (!user || !authService.isAuthenticated()) {
      router.push('/login')
      return
    }
    
    // Check if user has Doctor, Nurse, Staff, or Admin role
    const userRoles = user.roles || []
    const hasAccess = userRoles.some(role => ['Doctor', 'Nurse', 'Staff', 'Admin'].includes(role))
    
    if (!hasAccess) {
      setHasAccess(false)
      return
    }
    
    setHasAccess(true)
    loadTreatments()
    loadPatients()
  }, [router, loadTreatments, loadPatients])

  // Reload when filters change
  React.useEffect(() => {
    if (hasAccess) {
      const timer = setTimeout(() => {
        loadTreatments()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasAccess, loadTreatments])

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleCreateTreatment = async () => {
    try {
      await treatmentService.createTreatment(formData)
      setCreateModalOpen(false)
      resetForm()
      loadTreatments()
    } catch (err: unknown) {
      console.error('Error creating treatment:', err)
    }
  }

  const handleUpdateTreatment = async () => {
    if (!selectedTreatment) return
    
    try {
      await treatmentService.updateTreatment(selectedTreatment.id, formData)
      setEditModalOpen(false)
      setSelectedTreatment(null)
      resetForm()
      loadTreatments()
    } catch (err: unknown) {
      console.error('Error updating treatment:', err)
    }
  }

  const handleDeleteTreatment = async () => {
    if (!selectedTreatment) return
    
    try {
      await treatmentService.deleteTreatment(selectedTreatment.id)
      setDeleteModalOpen(false)
      setSelectedTreatment(null)
      loadTreatments()
    } catch (err: unknown) {
      console.error('Error deleting treatment:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      patientId: 0,
      treatmentType: '',
      treatmentName: '',
      startDate: '',
      endDate: '',
      dosage: '',
      frequency: '',
      status: 'active',
      sideEffects: '',
      response: ''
    })
  }

  const openCreateModal = () => {
    resetForm()
    setCreateModalOpen(true)
  }

  const openEditModal = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setFormData({
      patientId: treatment.patientId,
      treatmentType: treatment.treatmentType,
      treatmentName: treatment.treatmentName || '',
      startDate: treatment.startDate ? new Date(treatment.startDate).toISOString().split('T')[0] : '',
      endDate: treatment.endDate ? new Date(treatment.endDate).toISOString().split('T')[0] : '',
      dosage: treatment.dosage || '',
      frequency: treatment.frequency || '',
      status: treatment.status,
      sideEffects: treatment.sideEffects || '',
      response: treatment.response || ''
    })
    setEditModalOpen(true)
  }

  const openViewModal = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setViewModalOpen(true)
  }

  const openDeleteModal = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setDeleteModalOpen(true)
  }

  const getTreatmentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'chemotherapy': return 'bg-purple-100 text-purple-800'
      case 'surgery': return 'bg-red-100 text-red-800'
      case 'radiation': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
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
              You don&apos;t have permission to access Treatment Management. This feature is only available to Doctor, Nurse, Staff and Admin users.
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <PageHeader
        title="Treatment Management" 
        onBack={handleBackToDashboard}
      >
        <Button 
          onClick={openCreateModal} 
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Treatment</span>
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
                  placeholder="Search treatments by type, name, or patient..."
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
                className="flex items-center space-x-2 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl px-4 py-2 transition-all duration-200"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <Select
                label="Treatment Type"
                value={treatmentTypeFilter}
                onChange={(e) => setTreatmentTypeFilter(e.target.value)}
                options={[
                  { label: 'All Types', value: '' },
                  { label: 'Chemotherapy', value: 'chemotherapy' },
                  { label: 'Surgery', value: 'surgery' },
                  { label: 'Radiation', value: 'radiation' },
                  { label: 'Other', value: 'other' }
                ]}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: 'All Statuses', value: '' },
                  { label: 'Active', value: 'active' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' }
                ]}
              />
              <Select
                label="Patient"
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                options={[
                  { label: 'All Patients', value: '' },
                  ...patients.map(patient => ({
                    label: `${patient.name} (${patient.patientId})`,
                    value: patient.id.toString()
                  }))
                ]}
              />
            </div>
          )}
        </div>

        {/* Treatments List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <HeartIcon className="h-6 w-6 text-purple-600 mr-2" />
              Treatments ({treatments.length})
            </h2>
          </div>
          
          {treatments.length === 0 ? (
            <div className="text-center py-12">
              <HeartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No treatments found matching your criteria.</p>
              <Button 
                onClick={openCreateModal}
                className="mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl"
              >
                Add First Treatment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {treatments.map((treatment) => (
                    <tr key={treatment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{treatment.patientName}</div>
                          <div className="text-sm text-gray-500">ID: {treatment.patientCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTreatmentTypeColor(treatment.treatmentType)}`}>
                            {treatment.treatmentType}
                          </span>
                          <div className="text-sm text-gray-900 mt-1">{treatment.treatmentName || 'No name specified'}</div>
                          {treatment.dosage && (
                            <div className="text-xs text-gray-500">Dosage: {treatment.dosage}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {treatment.startDate ? new Date(treatment.startDate).toLocaleDateString() : 'Not specified'}
                        </div>
                        {treatment.endDate && (
                          <div className="text-sm text-gray-500">
                            to {new Date(treatment.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(treatment.status)}`}>
                          {treatment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{treatment.createdByName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{new Date(treatment.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 text-blue-600 hover:text-blue-700"
                            onClick={() => openViewModal(treatment)}
                            title="View Treatment"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 text-green-600 hover:text-green-700"
                            onClick={() => openEditModal(treatment)}
                            title="Edit Treatment"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 text-red-600 hover:text-red-700"
                            onClick={() => openDeleteModal(treatment)}
                            title="Delete Treatment"
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

      {/* Create Treatment Modal */}
      <Modal open={isCreateModalOpen} onOpenChange={setCreateModalOpen} title="Add New Treatment" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Patient"
              value={formData.patientId.toString()}
              onChange={(e) => setFormData({...formData, patientId: parseInt(e.target.value)})}
              options={[
                { label: 'Select Patient', value: '0' },
                ...patients.map(patient => ({
                  label: `${patient.name} (${patient.patientId})`,
                  value: patient.id.toString()
                }))
              ]}
              required
            />
            <Select
              label="Treatment Type"
              value={formData.treatmentType}
              onChange={(e) => setFormData({...formData, treatmentType: e.target.value})}
              options={[
                { label: 'Select Type', value: '' },
                { label: 'Chemotherapy', value: 'chemotherapy' },
                { label: 'Surgery', value: 'surgery' },
                { label: 'Radiation', value: 'radiation' },
                { label: 'Other', value: 'other' }
              ]}
              required
            />
            <Input 
              label="Treatment Name" 
              value={formData.treatmentName}
              onChange={(e) => setFormData({...formData, treatmentName: e.target.value})}
              placeholder="e.g., Carboplatin + Paclitaxel" 
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' }
              ]}
              required
            />
            <Input 
              type="date"
              label="Start Date" 
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            />
            <Input 
              type="date"
              label="End Date" 
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            />
            <Input 
              label="Dosage" 
              value={formData.dosage}
              onChange={(e) => setFormData({...formData, dosage: e.target.value})}
              placeholder="e.g., 60 Gy" 
            />
            <Input 
              label="Frequency" 
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              placeholder="e.g., Daily" 
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Side Effects</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                value={formData.sideEffects}
                onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
                placeholder="Describe any side effects..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                value={formData.response}
                onChange={(e) => setFormData({...formData, response: e.target.value})}
                placeholder="Describe treatment response..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleCreateTreatment}
              disabled={!formData.patientId || !formData.treatmentType}
            >
              Add Treatment
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Treatment Modal */}
      <Modal open={isViewModalOpen} onOpenChange={setViewModalOpen} title="Treatment Details" size="lg">
        {selectedTreatment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                  <label className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Patient</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedTreatment.patientName}</p>
                  <p className="text-sm text-gray-600">ID: {selectedTreatment.patientCode}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                  <label className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Treatment Type</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedTreatment.treatmentType}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                  <label className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Treatment Name</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">{selectedTreatment.treatmentName || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                  <label className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Status</label>
                  <div className="mt-2">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(selectedTreatment.status)}`}>
                      {selectedTreatment.status}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
                  <label className="text-sm font-semibold text-rose-700 uppercase tracking-wide">Duration</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {selectedTreatment.startDate ? new Date(selectedTreatment.startDate).toLocaleDateString() : 'Not specified'}
                    {selectedTreatment.endDate && ` - ${new Date(selectedTreatment.endDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                  <label className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Dosage & Frequency</label>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {selectedTreatment.dosage || 'Not specified'}
                    {selectedTreatment.frequency && ` - ${selectedTreatment.frequency}`}
                  </p>
                </div>
              </div>
            </div>
            
            {(selectedTreatment.sideEffects || selectedTreatment.response) && (
              <div className="space-y-4">
                {selectedTreatment.sideEffects && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-100">
                    <label className="text-sm font-semibold text-red-700 uppercase tracking-wide">Side Effects</label>
                    <p className="text-gray-900 mt-2">{selectedTreatment.sideEffects}</p>
                  </div>
                )}
                {selectedTreatment.response && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                    <label className="text-sm font-semibold text-green-700 uppercase tracking-wide">Response</label>
                    <p className="text-gray-900 mt-2">{selectedTreatment.response}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200/50">
              <Button 
                variant="outline" 
                onClick={() => setViewModalOpen(false)}
                className="px-8 py-3"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Treatment Modal */}
      <Modal open={isEditModalOpen} onOpenChange={setEditModalOpen} title="Edit Treatment" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Patient"
              value={formData.patientId.toString()}
              onChange={(e) => setFormData({...formData, patientId: parseInt(e.target.value)})}
              options={[
                { label: 'Select Patient', value: '0' },
                ...patients.map(patient => ({
                  label: `${patient.name} (${patient.patientId})`,
                  value: patient.id.toString()
                }))
              ]}
              required
            />
            <Select
              label="Treatment Type"
              value={formData.treatmentType}
              onChange={(e) => setFormData({...formData, treatmentType: e.target.value})}
              options={[
                { label: 'Select Type', value: '' },
                { label: 'Chemotherapy', value: 'chemotherapy' },
                { label: 'Surgery', value: 'surgery' },
                { label: 'Radiation', value: 'radiation' },
                { label: 'Other', value: 'other' }
              ]}
              required
            />
            <Input 
              label="Treatment Name" 
              value={formData.treatmentName}
              onChange={(e) => setFormData({...formData, treatmentName: e.target.value})}
              placeholder="e.g., Carboplatin + Paclitaxel" 
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' }
              ]}
              required
            />
            <Input 
              type="date"
              label="Start Date" 
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            />
            <Input 
              type="date"
              label="End Date" 
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            />
            <Input 
              label="Dosage" 
              value={formData.dosage}
              onChange={(e) => setFormData({...formData, dosage: e.target.value})}
              placeholder="e.g., 60 Gy" 
            />
            <Input 
              label="Frequency" 
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              placeholder="e.g., Daily" 
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Side Effects</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                value={formData.sideEffects}
                onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
                placeholder="Describe any side effects..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                value={formData.response}
                onChange={(e) => setFormData({...formData, response: e.target.value})}
                placeholder="Describe treatment response..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleUpdateTreatment}
              disabled={!formData.patientId || !formData.treatmentType}
            >
              Update Treatment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onOpenChange={setDeleteModalOpen} title="Delete Treatment" size="md">
        {selectedTreatment && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-900">
                  Are you sure you want to delete this <strong>{selectedTreatment.treatmentType}</strong> treatment for <strong>{selectedTreatment.patientName}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-xs text-red-700">
                <strong>Warning:</strong> Deleting this treatment will permanently remove all associated data including dosage, frequency, and response information.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteTreatment}>Delete Treatment</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
