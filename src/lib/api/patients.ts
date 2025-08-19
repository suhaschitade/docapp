import { authService } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5145';

interface ApiResponse<T> {
  data: T;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  primaryCancerSite: string;
  cancerStage?: string;
  histology?: string;
  diagnosisDate?: string;
  treatmentPathway: string;
  currentStatus: string;
  riskLevel: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  registrationDate: string;
  lastVisitDate?: string;
  nextFollowupDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientOption {
  id: number;
  patientId: string;
  name: string;
  phone: string;
  age: number;
}

class PatientService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`🔄 API Response: ${response.status} ${response.statusText} for ${response.url}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    if (response.status === 204) {
      console.log('✅ API Success: No content (204)');
      return {} as T;
    }
    
    const data = await response.json();
    console.log('✅ API Success: Data received', data);
    return data;
  }

  // Search patients with filters
  async searchPatients(params?: {
    search?: string;
    status?: string;
    cancerSite?: string;
    riskLevel?: string;
    assignedDoctorId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Patient[]>> {
    console.log('🔍 Searching patients with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.cancerSite) queryParams.append('cancerSite', params.cancerSite);
    if (params?.riskLevel) queryParams.append('riskLevel', params.riskLevel);
    if (params?.assignedDoctorId) queryParams.append('assignedDoctorId', params.assignedDoctorId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${API_BASE_URL}/api/patients?${queryParams}`;
    console.log('🌐 GET request to:', url);
    console.log('🔑 Headers:', this.getAuthHeaders());

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ApiResponse<Patient[]>>(response);
  }

  // Get patient options for dropdown/typeahead (simplified format)
  async getPatientOptions(search?: string): Promise<PatientOption[]> {
    const response = await this.searchPatients({
      search,
      pageSize: 20, // Limit for dropdown
    });

    return response.data.map(patient => ({
      id: patient.id,
      patientId: patient.patientId,
      name: `${patient.firstName} ${patient.lastName}`,
      phone: patient.mobileNumber,
      age: patient.age,
    }));
  }

  // Get single patient
  async getPatient(id: number): Promise<Patient> {
    const response = await fetch(
      `${API_BASE_URL}/api/patients/${id}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Patient>(response);
  }

  // Create a new patient with minimal required data
  async createPatient(patientData: {
    patientName: string;
    phone: string;
    email?: string;
    gender?: string;
    dateOfBirth?: string;
  }): Promise<Patient> {
    console.log('➕ Creating patient with data:', patientData);
    
    // Parse name into first and last name
    const nameParts = patientData.patientName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate a unique patient ID
    const patientId = `P${Date.now().toString().slice(-6)}`;
    
    const requestBody = {
      patientId,
      firstName,
      lastName,
      dateOfBirth: patientData.dateOfBirth || new Date(Date.now() - 30 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 years ago
      gender: patientData.gender || 'Other',
      mobileNumber: patientData.phone,
      email: patientData.email || '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      emergencyContactName: '',
      emergencyContactPhone: '',
      primaryCancerSite: 'Other',
      cancerStage: '',
      histology: '',
      diagnosisDate: null,
      treatmentPathway: 'Curative',
      riskLevel: 'Medium',
      assignedDoctorId: null,
      nextFollowupDate: null
    };
    
    console.log('📤 Request body:', requestBody);
    console.log('🔑 Headers:', this.getAuthHeaders());
    console.log('🌐 POST request to:', `${API_BASE_URL}/api/patients`);

    const response = await fetch(
      `${API_BASE_URL}/api/patients`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    return this.handleResponse<Patient>(response);
  }
}

export const patientService = new PatientService();
