import { authService } from '../auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5145';

interface ApiResponse<T> {
  data: T;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled' | 'pending' | 'confirmed';
  notes?: string;
  consultationNotes?: string;
  nextAppointmentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentByName {
  patientName: string;
  phone: string;
  doctorId?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  notes?: string;
}

export interface AppointmentCalendar {
  date: string;
  appointments: AppointmentTimeSlot[];
}

export interface AppointmentTimeSlot {
  id: number;
  patientName: string;
  phone: string;
  time: string;
  type: string;
  status: string;
}

class AppointmentService {
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

  // Get appointments with filters
  async getAppointments(params?: {
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    patientId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<Appointment[]>> {
    console.log('📋 Fetching appointments with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
    if (params?.patientId) queryParams.append('patientId', params.patientId.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${API_BASE_URL}/api/appointments?${queryParams}`;
    console.log('🌐 GET request to:', url);
    console.log('🔑 Headers:', this.getAuthHeaders());

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ApiResponse<Appointment[]>>(response);
  }

  // Get appointment calendar data
  async getAppointmentCalendar(params?: {
    doctorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AppointmentCalendar[]> {
    console.log('📅 Fetching appointment calendar with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = `${API_BASE_URL}/api/appointments/calendar?${queryParams}`;
    console.log('🌐 GET request to:', url);

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<AppointmentCalendar[]>(response);
  }

  // Get single appointment
  async getAppointment(id: number): Promise<Appointment> {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/${id}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Appointment>(response);
  }

  // Create appointment by patient name (for quick booking)
  async createAppointmentByName(appointmentData: CreateAppointmentByName): Promise<Appointment> {
    console.log('➕ Creating appointment by name with data:', appointmentData);
    
    const requestBody = {
      ...appointmentData,
      appointmentDate: appointmentData.appointmentDate,
      appointmentTime: appointmentData.appointmentTime,
    };
    
    console.log('📤 Request body:', requestBody);
    console.log('🔑 Headers:', this.getAuthHeaders());
    console.log('🌐 POST request to:', `${API_BASE_URL}/api/appointments/by-name`);

    const response = await fetch(
      `${API_BASE_URL}/api/appointments/by-name`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    return this.handleResponse<Appointment>(response);
  }

  // Update appointment
  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/${id}`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData),
      }
    );

    return this.handleResponse<void>(response);
  }

  // Delete appointment
  async deleteAppointment(id: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/${id}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<void>(response);
  }

  // Get appointment statistics
  async getAppointmentStatistics(params?: {
    doctorId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(
      `${API_BASE_URL}/api/appointments/statistics?${queryParams}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  // Convert time string to the format expected by backend
  formatTimeForBackend(timeString: string): string {
    // Convert "HH:MM" to "HH:MM:SS" format
    if (timeString && !timeString.includes(':00', timeString.lastIndexOf(':'))) {
      return `${timeString}:00`;
    }
    return timeString;
  }

  // Convert backend time format to frontend format
  formatTimeForFrontend(timeString: string): string {
    // Convert "HH:MM:SS" to "HH:MM" format
    if (timeString && timeString.length > 5) {
      return timeString.substring(0, 5);
    }
    return timeString;
  }
}

export const appointmentService = new AppointmentService();
