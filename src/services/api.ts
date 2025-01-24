import { Member, Announcement, Transaction, FinanceSummary, ApiError, AttendanceRecord, ApiResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

// Helper function to handle API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }

    return data as T;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error: Please check your connection');
    }
    throw error;
  }
}

// Members API
export const membersApi = {
  getAll: () => apiCall<Member[]>('/members'),
  create: (data: Omit<Member, '_id' | 'createdAt' | 'updatedAt'>) => 
    apiCall<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Member>) => 
    apiCall<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall<{ message: string }>(`/members/${id}`, {
    method: 'DELETE',
  }),
};

// Announcements API
export const announcementsApi = {
  getAll: () => apiCall<Announcement[]>('/announcements'),
  create: (data: Omit<Announcement, '_id' | 'createdAt' | 'updatedAt' | 'sender' | 'type'>) => 
    apiCall<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Announcement>) => 
    apiCall<Announcement>(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => apiCall<{ message: string }>(`/announcements/${id}`, {
    method: 'DELETE',
  }),
};

// Finance API
export const financeApi = {
  getAll: async (date?: string) => {
    const url = date ? `/finance?date=${date}` : '/finance';
    return apiCall<ApiResponse<Transaction[]>>(url);
  },
  create: (data: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt' | 'recordedBy'>) => 
    apiCall<ApiResponse<Transaction>>('/finance', {
      method: 'POST',
      body: JSON.stringify({ ...data, sentToPastor: false }),
    }),
  update: (id: string, data: Partial<Transaction>) => 
    apiCall<ApiResponse<Transaction>>(`/finance/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, sentToPastor: false }),
    }),
  delete: (id: string) => 
    apiCall<ApiResponse<{ message: string }>>(`/finance/${id}`, {
      method: 'DELETE',
    }),
  getSummary: () => 
    apiCall<ApiResponse<FinanceSummary>>('/finance/summary'),
  sendToPastor: (id: string) => 
    apiCall<ApiResponse<Transaction>>(`/finance/${id}/send`, {
      method: 'POST',
    })
};

// Attendance API
export const attendanceApi = {
  getAll: (date?: string) => {
    const url = date ? `/attendance?date=${date}` : '/attendance';
    return apiCall<ApiResponse<AttendanceRecord[]>>(url);
  },
  create: (data: Partial<AttendanceRecord>) => 
    apiCall<ApiResponse<AttendanceRecord>>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<AttendanceRecord>) => 
    apiCall<ApiResponse<AttendanceRecord>>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    apiCall<ApiResponse<{ message: string }>>(`/attendance/${id}`, {
      method: 'DELETE',
    }),
  getSummary: () => 
    apiCall<ApiResponse<{
      monthly: {
        totalAttendance: number;
        totalFirstTimers: number;
        avgAttendance: number;
        services: number;
      };
      today: {
        totalAttendance: number;
        totalFirstTimers: number;
      };
    }>>('/attendance/summary'),
  sendToPastor: (id: string) => 
    apiCall<ApiResponse<{ message: string }>>(`/attendance/${id}/send`, {
      method: 'POST',
    }),
}; 