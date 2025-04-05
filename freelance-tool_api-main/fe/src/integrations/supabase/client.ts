// Modified version of the client file to work with Express backend
import { Database } from './types';

// Express server URL - should be set via environment variables in production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Helper function to handle API requests
const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    // Add authentication token if available
    const token = localStorage.getItem('jwt_token');
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in ${method} request to ${endpoint}:`, error);
    throw error;
  }
};

// Authentication functions
export const signUp = async (email: string, password: string) => {
  return apiRequest('/signup', 'POST', { email, password });
};

export const signIn = async (email: string, password: string) => {
  const data = await apiRequest('/signin', 'POST', { email, password });
  
  // Store the JWT token in localStorage
  if (data.token) {
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user_id', data.userId);
    localStorage.setItem('user_name', data.userName);
  }
  
  return data;
};

export const signOut = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  return true;
};

// Function to validate name uniqueness
export const checkNameUniqueness = async (
  table: 'api_collections' | 'api_tests' | 'test_schedules',
  name: string,
  excludeId?: string
) => {
  try {
    const params = new URLSearchParams();
    params.append('table', table);
    params.append('name', name);
    if (excludeId) params.append('excludeId', excludeId);
    
    return await apiRequest(`/check-name-unique?${params.toString()}`);
  } catch (error) {
    console.error('Error checking name uniqueness:', error);
    throw error;
  }
};

// Test Schedules functions
export const createTestSchedule = async (scheduleData: {
  name: string;
  collection_id: string;
  frequency: string;
  selected_days: string;
  timer_type: string;
  minute_interval: number;
  send_email: boolean;
  recipient_email: string;
  user_id: string;
}) => {
  return apiRequest('/test-schedules', 'POST', scheduleData);
};

export const getTestSchedules = async (userId: string) => {
  return apiRequest(`/test-schedules?userId=${userId}`);
};

export const updateTestScheduleStatus = async (scheduleId: string, active: boolean) => {
  return apiRequest(`/test-schedules/${scheduleId}/status`, 'PATCH', { active });
};

export const deleteTestSchedule = async (scheduleId: string) => {
  return apiRequest(`/test-schedules/${scheduleId}`, 'DELETE');
};

// API Tests functions
export const createApiTest = async (data: {
  name: string;
  method: string;
  url: string;
  headers: any;
  body: string;
  response: string;
  status_code: number;
  user_id: string;
  collection_id: string;
}) => {
  return apiRequest('/api-tests', 'POST', data);
  
};


export const deleteApiTest = async (testId: string) => {
  return apiRequest(`/api-tests/${testId}`, 'DELETE');
};
export const getApiTests = async (userId: string) => {
  return apiRequest(`/api-tests?userId=${userId}`);
};

// API Collections functions
export const createApiCollection = async (collectionData: {
  name: string;
  description: string;
  user_id: string;
}) => {
  return apiRequest('/api-collections', 'POST', collectionData);
};

export const getApiCollections = async (userId: string) => {
  return apiRequest(`/api-collections?userId=${userId}`);
};

// Run functions
export const runCollection = async (collectionId: string, userId: string) => {
  return apiRequest('/run-collection', 'POST', { collectionId, userId });
};

export const runSchedule = async (scheduleId: string) => {
  return apiRequest(`/run-schedule/${scheduleId}`, 'POST');
};

export const runSingleTest = async (testId: string, userId: string) => {
  return apiRequest('/run-single-test', 'POST', { testId, userId });
};

// Pagination functions
export const getTestRunHistory = async (userId: string, page = 1, pageSize = 10) => {
  return apiRequest(`/test-run-history?userId=${userId}&page=${page}&pageSize=${pageSize}`);
};

export const getCollections = async (userId: string, page = 1, pageSize = 10) => {
  return apiRequest(`/api-collections?userId=${userId}&page=${page}&pageSize=${pageSize}`);
};

export const getTestsInCollection = async (collectionId: string, page = 1, pageSize = 10) => {
  return apiRequest(`/api-tests?collectionId=${collectionId}&page=${page}&pageSize=${pageSize}`);
};

export const getSchedules = async (userId: string, page = 1, pageSize = 10) => {
  return apiRequest(`/test-schedules?userId=${userId}&page=${page}&pageSize=${pageSize}`);
};

export const getTestRunDetails = async (runId: string) => {
  return apiRequest(`/test-run-details/${runId}`);
};

export const sendEmailReport = async (runId: string, email: string) => {
  return apiRequest('/send-email-report', 'POST', { runId, email });
};

// Helper function to parse collection name
export function parseName(name: any): string {
  if (!name) return '';
  if (typeof name !== 'string') return String(name);
  
  try {
    const parsed = JSON.parse(name);
    return parsed?.name || name;
  } catch (e) {
    // If parsing fails, return the original name
    return name;
  }
}

// Log initialization for debugging
if (isBrowser()) {
  console.log('API client initialized with URL:', API_URL);
}