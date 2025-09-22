import { authService } from '../auth';
import { getApiBaseUrl } from '../api-config';

const API_BASE_URL = getApiBaseUrl();

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string;
  specialization?: string;
  fullName: string;
  displayName: string;
}

class DoctorService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`🔄 Doctors API Response: ${response.status} ${response.statusText} for ${response.url}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Doctors API Error: ${response.status} - ${errorText}`);
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    if (response.status === 204) {
      console.log('✅ Doctors API Success: No content (204)');
      return {} as T;
    }
    
    const data = await response.json();
    console.log('✅ Doctors API Success: Data received', data);
    return data;
  }

  // Get all doctors
  async getDoctors(): Promise<Doctor[]> {
    console.log('👨‍⚕️ Fetching all doctors');
    
    const url = `${API_BASE_URL}/doctors`;
    console.log('🌐 GET request to:', url);
    console.log('🔑 Headers:', this.getAuthHeaders());

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Doctor[]>(response);
  }

  // Get single doctor
  async getDoctor(id: string): Promise<Doctor> {
    console.log('👨‍⚕️ Fetching doctor with ID:', id);

    const response = await fetch(
      `${API_BASE_URL}/doctors/${id}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Doctor>(response);
  }
}

export const doctorService = new DoctorService();
