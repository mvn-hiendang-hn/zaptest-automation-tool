import { RequestConfig } from '@/components/RequestForm';
import { API_BASE_URL } from '@/config/api';

// Define the response type
export interface ApiResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  time: number;
}

// Mock data for demonstration when URL contains "mock"
const mockResponses: Record<string, any> = {
  'users': {
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ],
    status: 200,
    statusText: 'OK'
  },
  'user': {
    data: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
    status: 200,
    statusText: 'OK'
  },
  'error': {
    data: { message: 'Not Found', error: 'The requested resource was not found' },
    status: 404,
    statusText: 'Not Found'
  },
  'auth': {
    data: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
    status: 200,
    statusText: 'OK'
  }
};

// Parse headers from a fetch response
const parseHeaders = (headers: Headers): Record<string, string> => {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

// Create a mock response based on the URL
const createMockResponse = (url: string, config: RequestConfig): ApiResponse => {
  // Extract the endpoint from the URL
  const urlLower = url.toLowerCase();
  let mockData;
  
  if (urlLower.includes('users')) {
    mockData = mockResponses['users'];
  } else if (urlLower.includes('user')) {
    mockData = mockResponses['user'];
  } else if (urlLower.includes('error') || urlLower.includes('404')) {
    mockData = mockResponses['error'];
  } else if (urlLower.includes('auth') || urlLower.includes('login')) {
    mockData = mockResponses['auth'];
  } else {
    // Default mock response
    mockData = {
      data: { message: 'Mock API response', url, method: config.method },
      status: 200,
      statusText: 'OK'
    };
  }

  // Add some delay to simulate network latency (between 200-800ms)
  const time = Math.floor(Math.random() * 600) + 200;

  return {
    data: mockData.data,
    status: mockData.status,
    statusText: mockData.statusText,
    headers: {
      'content-type': 'application/json',
      'x-powered-by': 'API Tracker Mock Server',
      'cache-control': 'no-cache',
      'date': new Date().toUTCString()
    },
    time
  };
};

// Send an API request
export const sendRequest = async (config: RequestConfig): Promise<ApiResponse> => {
  const startTime = Date.now();
  
  try {
    // Check if this is a mock request (for demo purposes)
    if (config.url.includes('mock')) {
      return new Promise(resolve => {
        // Add a slight delay to simulate network
        setTimeout(() => {
          resolve(createMockResponse(config.url, config));
        }, Math.floor(Math.random() * 600) + 200);
      });
    }
    
    // Prepare fetch options
    const options: RequestInit = {
      method: config.method,
      headers: config.headers,
    };
    
    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body) {
      options.body = config.body;
    }
    
    // Make the actual request
    const response = await fetch(config.url, options);
    const endTime = Date.now();
    
    // Try to parse as JSON, or get text if that fails
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: parseHeaders(response.headers),
      time: endTime - startTime
    };
  } catch (error) {
    const endTime = Date.now();
    throw new Error(error instanceof Error ? error.message : 'Failed to send request');
  }
};

// Test name validation API
export const validateTestName = async (name: string, collectionId: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/tests/validate?name=${encodeURIComponent(name)}&collectionId=${collectionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to validate test name');
    }
    const data = await response.json();
    return data.isDuplicate;
  } catch (error) {
    console.error('Error validating test name:', error);
    throw error;
  }
};
