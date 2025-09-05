import { authService } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5145';

interface ApiResponse<T> {
  data: T;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface Investigation {
  id: number;
  patientId: number;
  patientName: string;
  patientCode: string;
  investigationType: string;
  investigationName: string;
  orderedDate: string;
  resultDate?: string;
  resultValue?: string;
  normalRange?: string;
  status: string;
  priority: string;
  orderedBy: string;
  orderedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvestigationDto {
  patientId: number;
  investigationType: string;
  investigationName: string;
  orderedDate: string;
  resultDate?: string;
  resultValue?: string;
  normalRange?: string;
  status: string;
  priority: string;
}

export type UpdateInvestigationDto = CreateInvestigationDto;

export interface InvestigationStatistics {
  totalInvestigations: number;
  pendingInvestigations: number;
  completedInvestigations: number;
  urgentInvestigations: number;
  investigationsThisMonth: number;
  investigationsByType: { investigationType: string; count: number }[];
  investigationsByStatus: { status: string; count: number }[];
  investigationsByPriority: { priority: string; count: number }[];
}

class InvestigationService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`🔄 Investigation API Response: ${response.status} ${response.statusText} for ${response.url}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Investigation API Error: ${response.status} - ${errorText}`);
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    if (response.status === 204) {
      console.log('✅ Investigation API Success: No content (204)');
      return {} as T;
    }
    
    const data = await response.json();
    console.log('✅ Investigation API Success: Data received', data);
    return data;
  }

  // Get all investigations with filters
  async getInvestigations(params?: {
    patientId?: number;
    investigationType?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Investigation[]>> {
    console.log('🔍 Getting investigations with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params?.patientId) queryParams.append('patientId', params.patientId.toString());
    if (params?.investigationType) queryParams.append('investigationType', params.investigationType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${API_BASE_URL}/api/investigations?${queryParams}`;
    console.log('🌐 GET request to:', url);
    console.log('🔑 Headers:', this.getAuthHeaders());

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ApiResponse<Investigation[]>>(response);
  }

  // Get single investigation
  async getInvestigation(id: number): Promise<Investigation> {
    console.log('🔍 Getting investigation with id:', id);

    const response = await fetch(
      `${API_BASE_URL}/api/investigations/${id}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Investigation>(response);
  }

  // Get investigations for specific patient
  async getPatientInvestigations(patientId: number): Promise<Investigation[]> {
    console.log('🔍 Getting investigations for patient:', patientId);

    const response = await fetch(
      `${API_BASE_URL}/api/investigations/patient/${patientId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Investigation[]>(response);
  }

  // Create new investigation
  async createInvestigation(investigationData: CreateInvestigationDto): Promise<Investigation> {
    console.log('➕ Creating investigation with data:', investigationData);
    
    const response = await fetch(
      `${API_BASE_URL}/api/investigations`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(investigationData),
      }
    );

    return this.handleResponse<Investigation>(response);
  }

  // Update investigation
  async updateInvestigation(id: number, investigationData: UpdateInvestigationDto): Promise<void> {
    console.log('📝 Updating investigation with id:', id, 'data:', investigationData);
    
    const response = await fetch(
      `${API_BASE_URL}/api/investigations/${id}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(investigationData),
      }
    );

    return this.handleResponse<void>(response);
  }

  // Delete investigation
  async deleteInvestigation(id: number): Promise<void> {
    console.log('🗑️ Deleting investigation with id:', id);
    
    const response = await fetch(
      `${API_BASE_URL}/api/investigations/${id}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<void>(response);
  }

  // Get investigation statistics
  async getInvestigationStatistics(): Promise<InvestigationStatistics> {
    console.log('📊 Getting investigation statistics');

    const response = await fetch(
      `${API_BASE_URL}/api/investigations/statistics`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<InvestigationStatistics>(response);
  }

  // Helper methods for dropdowns and formatting
  getInvestigationTypes(): string[] {
    return [
      'Blood Test',
      'Urine Test', 
      'X-Ray',
      'CT Scan',
      'MRI',
      'Ultrasound',
      'ECG',
      'Echocardiogram',
      'Endoscopy',
      'Colonoscopy',
      'Biopsy',
      'Culture Test',
      'Pathology',
      'Radiology',
      'Cardiology',
      'Neurology',
      'Orthopedic',
      'Other'
    ];
  }

  getStatusOptions(): string[] {
    return ['pending', 'in_progress', 'completed', 'cancelled', 'reviewed'];
  }

  getPriorityOptions(): string[] {
    return ['routine', 'urgent', 'stat', 'priority'];
  }

  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      reviewed: 'Reviewed'
    };
    return statusMap[status] || status;
  }

  formatPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      routine: 'Routine',
      urgent: 'Urgent',
      stat: 'STAT',
      priority: 'Priority'
    };
    return priorityMap[priority] || priority;
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: 'yellow',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red',
      reviewed: 'purple'
    };
    return colorMap[status] || 'gray';
  }

  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      routine: 'gray',
      urgent: 'orange',
      stat: 'red',
      priority: 'yellow'
    };
    return colorMap[priority] || 'gray';
  }
}

export const investigationService = new InvestigationService();
