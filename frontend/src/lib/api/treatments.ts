import { authService } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5145';

interface ApiResponse<T> {
  data: T;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface Treatment {
  id: number;
  patientId: number;
  patientName: string;
  patientCode: string;
  treatmentType: string;
  treatmentName?: string;
  startDate?: string;
  endDate?: string;
  dosage?: string;
  frequency?: string;
  status: string;
  sideEffects?: string;
  response?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentDto {
  patientId: number;
  treatmentType: string;
  treatmentName?: string;
  startDate?: string;
  endDate?: string;
  dosage?: string;
  frequency?: string;
  status: string;
  sideEffects?: string;
  response?: string;
}

export type UpdateTreatmentDto = CreateTreatmentDto;

export interface TreatmentStatistics {
  totalTreatments: number;
  activeTreatments: number;
  completedTreatments: number;
  treatmentsThisMonth: number;
  treatmentsByType: { treatmentType: string; count: number }[];
  treatmentsByStatus: { status: string; count: number }[];
}

class TreatmentService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`🔄 Treatment API Response: ${response.status} ${response.statusText} for ${response.url}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Treatment API Error: ${response.status} - ${errorText}`);
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    if (response.status === 204) {
      console.log('✅ Treatment API Success: No content (204)');
      return {} as T;
    }
    
    const data = await response.json();
    console.log('✅ Treatment API Success: Data received', data);
    return data;
  }

  // Get all treatments with filters
  async getTreatments(params?: {
    patientId?: number;
    treatmentType?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Treatment[]>> {
    console.log('🔍 Getting treatments with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params?.patientId) queryParams.append('patientId', params.patientId.toString());
    if (params?.treatmentType) queryParams.append('treatmentType', params.treatmentType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${API_BASE_URL}/api/treatments?${queryParams}`;
    console.log('🌐 GET request to:', url);
    console.log('🔑 Headers:', this.getAuthHeaders());

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ApiResponse<Treatment[]>>(response);
  }

  // Get single treatment
  async getTreatment(id: number): Promise<Treatment> {
    console.log('🔍 Getting treatment with id:', id);

    const response = await fetch(
      `${API_BASE_URL}/api/treatments/${id}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Treatment>(response);
  }

  // Get treatments for specific patient
  async getPatientTreatments(patientId: number): Promise<Treatment[]> {
    console.log('🔍 Getting treatments for patient:', patientId);

    const response = await fetch(
      `${API_BASE_URL}/api/treatments/patient/${patientId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Treatment[]>(response);
  }

  // Create new treatment
  async createTreatment(treatmentData: CreateTreatmentDto): Promise<Treatment> {
    console.log('➕ Creating treatment with data:', treatmentData);
    
    const response = await fetch(
      `${API_BASE_URL}/api/treatments`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(treatmentData),
      }
    );

    return this.handleResponse<Treatment>(response);
  }

  // Update treatment
  async updateTreatment(id: number, treatmentData: UpdateTreatmentDto): Promise<void> {
    console.log('📝 Updating treatment with id:', id, 'data:', treatmentData);
    
    const response = await fetch(
      `${API_BASE_URL}/api/treatments/${id}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(treatmentData),
      }
    );

    return this.handleResponse<void>(response);
  }

  // Delete treatment
  async deleteTreatment(id: number): Promise<void> {
    console.log('🗑️ Deleting treatment with id:', id);
    
    const response = await fetch(
      `${API_BASE_URL}/api/treatments/${id}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<void>(response);
  }

  // Get treatment statistics
  async getTreatmentStatistics(): Promise<TreatmentStatistics> {
    console.log('📊 Getting treatment statistics');

    const response = await fetch(
      `${API_BASE_URL}/api/treatments/statistics`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<TreatmentStatistics>(response);
  }
}

export const treatmentService = new TreatmentService();
