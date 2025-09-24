import { authService } from '../auth';
import { getApiBaseUrl } from '../api-config';

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data: T;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// Enums to match backend exactly
export enum Gender {
  Male = 'M',
  Female = 'F',
  Other = 'O'
}

export enum CancerSiteType {
  Lung = 'Lung',
  Breast = 'Breast',
  Kidney = 'Kidney',
  Colon = 'Colon',
  Prostate = 'Prostate',
  Cervical = 'Cervical',
  Ovarian = 'Ovarian',
  Liver = 'Liver',
  Stomach = 'Stomach',
  Pancreatic = 'Pancreatic',
  Brain = 'Brain',
  Blood = 'Blood',
  Other = 'Other'
}

export enum TreatmentPathwayType {
  Curative = 'Curative',
  Palliative = 'Palliative'
}

export enum PatientStatusType {
  Active = 'Active',
  Completed = 'Completed',
  Defaulter = 'Defaulter',
  LostToFollowup = 'LostToFollowup',
  Deceased = 'Deceased'
}

export enum RiskLevelType {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender | string;
  mobileNumber: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Cancer specific information
  primaryCancerSite: CancerSiteType | string;
  cancerStage?: string;
  histology?: string;
  diagnosisDate?: string;
  treatmentPathway: TreatmentPathwayType | string;
  
  // Status and risk
  currentStatus: PatientStatusType | string;
  riskLevel: RiskLevelType | string;
  
  // Tracking
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  registrationDate: string;
  lastVisitDate?: string;
  nextFollowupDate?: string;
  
  // Excel import related fields
  siteSpecificDiagnosis?: string;
  registrationYear?: number;
  secondaryContactPhone?: string;
  tertiaryContactPhone?: string;
  dateLoggedIn?: string;
  excelSheetSource?: string;
  excelRowNumber?: number;
  originalMRN?: string;
  importedFromExcel: boolean;
  
  // Metadata
  createdBy?: string;
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

    const url = `${API_BASE_URL}/patients?${queryParams}`;
    console.log('🌐 GET request to:', url);
    console.log('🔑 Headers:', this.getAuthHeaders());

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ApiResponse<Patient[]>>(response);
  }

  // Get patient options for dropdown/typeahead (simplified format)
  async getPatientOptions(search?: string, assignedDoctorId?: string): Promise<PatientOption[]> {
    const response = await this.searchPatients({
      search,
      assignedDoctorId,
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
      `${API_BASE_URL}/patients/${id}`,
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
    age?: number;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    primaryCancerSite?: string;
    cancerStage?: string;
    histology?: string;
    diagnosisDate?: string;
    treatmentPathway?: string;
    riskLevel?: string;
    assignedDoctorId?: string;
    nextFollowupDate?: string;
    siteSpecificDiagnosis?: string;
    registrationYear?: number;
    secondaryContactPhone?: string;
    tertiaryContactPhone?: string;
    originalMRN?: string;
  }): Promise<Patient> {
    console.log('➕ Creating patient with data:', patientData);
    console.log('🌐 API_BASE_URL being used:', API_BASE_URL);
    console.log('🔍 Environment variable NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
    
    // Parse name into first and last name
    const nameParts = patientData.patientName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate a unique patient ID
    const patientId = `P${Date.now().toString().slice(-6)}`;
    
    // Use provided age or default
    const patientAge = patientData.age || 30; // Default age if not provided
    
    const requestBody = {
      patientId,
      firstName,
      lastName,
      age: patientAge,
      gender: patientData.gender || Gender.Other,
      mobileNumber: patientData.phone,
      email: patientData.email || '',
      address: patientData.address || '',
      city: patientData.city || '',
      state: patientData.state || '',
      postalCode: patientData.postalCode || '',
      country: patientData.country || 'India',
      emergencyContactName: patientData.emergencyContactName || '',
      emergencyContactPhone: patientData.emergencyContactPhone || '',
      primaryCancerSite: patientData.primaryCancerSite || CancerSiteType.Other,
      cancerStage: patientData.cancerStage || '',
      histology: patientData.histology || '',
      diagnosisDate: patientData.diagnosisDate || null,
      treatmentPathway: patientData.treatmentPathway || TreatmentPathwayType.Curative,
      currentStatus: PatientStatusType.Active,
      riskLevel: patientData.riskLevel || RiskLevelType.Medium,
      assignedDoctorId: patientData.assignedDoctorId || null,
      nextFollowupDate: patientData.nextFollowupDate || null,
      // Additional fields
      siteSpecificDiagnosis: patientData.siteSpecificDiagnosis || '',
      registrationYear: patientData.registrationYear || new Date().getFullYear(),
      secondaryContactPhone: patientData.secondaryContactPhone || '',
      tertiaryContactPhone: patientData.tertiaryContactPhone || '',
      originalMRN: patientData.originalMRN || '',
      importedFromExcel: false
    };
    
    console.log('📤 Request body:', requestBody);
    console.log('🔑 Headers:', this.getAuthHeaders());
    console.log('🌐 POST request to:', `${API_BASE_URL}/patients`);

    const response = await fetch(
      `${API_BASE_URL}/patients`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    return this.handleResponse<Patient>(response);
  }

  // Update an existing patient
  async updatePatient(id: number, patientData: {
    patientId: string;
    firstName: string;
    lastName: string;
    age?: number;
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
    diagnosisDate?: string | null;
    treatmentPathway: string;
    currentStatus: string;
    riskLevel: string;
    assignedDoctorId?: string | null;
    nextFollowupDate?: string | null;
    // Additional fields
    siteSpecificDiagnosis?: string;
    registrationYear?: number;
    secondaryContactPhone?: string;
    tertiaryContactPhone?: string;
    originalMRN?: string;
    importedFromExcel?: boolean;
  }): Promise<void> {
    console.log('✏️ Updating patient with ID:', id, 'and data:', patientData);
    
    // Use provided age or default
    const patientAge = patientData.age || 30; // Use provided age
    
    const requestBody = {
      patientId: patientData.patientId,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      age: patientAge,
      gender: patientData.gender,
      mobileNumber: patientData.mobileNumber,
      email: patientData.email || '',
      address: patientData.address || '',
      city: patientData.city || '',
      state: patientData.state || '',
      postalCode: patientData.postalCode || '',
      country: patientData.country || 'India',
      emergencyContactName: patientData.emergencyContactName || '',
      emergencyContactPhone: patientData.emergencyContactPhone || '',
      primaryCancerSite: patientData.primaryCancerSite,
      cancerStage: patientData.cancerStage || '',
      histology: patientData.histology || '',
      diagnosisDate: patientData.diagnosisDate ? patientData.diagnosisDate : null,
      treatmentPathway: patientData.treatmentPathway,
      currentStatus: patientData.currentStatus,
      riskLevel: patientData.riskLevel,
      assignedDoctorId: patientData.assignedDoctorId || null,
      nextFollowupDate: patientData.nextFollowupDate ? patientData.nextFollowupDate : null,
      // Additional fields
      siteSpecificDiagnosis: patientData.siteSpecificDiagnosis || '',
      registrationYear: patientData.registrationYear || new Date().getFullYear(),
      secondaryContactPhone: patientData.secondaryContactPhone || '',
      tertiaryContactPhone: patientData.tertiaryContactPhone || '',
      originalMRN: patientData.originalMRN || '',
      importedFromExcel: patientData.importedFromExcel || false
    };
    
    console.log('📤 PUT request body:', requestBody);
    console.log('🔑 Headers:', this.getAuthHeaders());
    console.log('🌐 PUT request to:', `${API_BASE_URL}/patients/${id}`);

    const response = await fetch(
      `${API_BASE_URL}/patients/${id}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    return this.handleResponse<void>(response);
  }
}

export const patientService = new PatientService();
