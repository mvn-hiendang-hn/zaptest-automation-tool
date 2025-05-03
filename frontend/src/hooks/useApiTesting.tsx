import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { RequestConfig } from '@/types';
import { API_BASE_URL } from '@/config/api';
import { validateTestName as apiValidateTestName, sendRequest } from '@/utils/apiService';

export function useApiTesting(userId: string | undefined) {
  const { toast } = useToast();
  
  const [request, setRequest] = useState<RequestConfig>({
    method: 'GET',
    url: '',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  });
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [currentRequest, setCurrentRequest] = useState<{
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  }>({
    method: '',
    url: '',
    headers: {},
    body: ''
  });

  const loadCollections = useCallback(async () => {
    if (!userId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/collections`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách collections');
      }

      const data = await response.json();
      setCollections(data.data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: 'Lỗi tải collections',
        description: 'Không thể tải danh sách collections. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  }, [userId, toast]);

  const createCollection = async (name: string, description: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create collection');
      }

      const collection = await response.json();
      // Đảm bảo luôn trả về id string
      let collectionId = collection.id || (collection.data && collection.data.id);
      if (!collectionId) throw new Error('Failed to get collection id');
      setCollections(prev => [...prev, { id: collectionId, name }]);
      return collectionId;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error; // Propagate error to be handled by caller
    }
  };

  const handleSendRequest = async (newRequest: RequestConfig) => {
    if (!newRequest.url?.trim()) {
      toast({
        title: 'URL is required',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      new URL(newRequest.url);
    } catch (error) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL (e.g. https://api.example.com)',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await sendRequest(newRequest);
      setResponseStatus(response.status);
      setResponseData(response.data);
      setCurrentRequest({
        method: newRequest.method,
        url: newRequest.url,
        headers: newRequest.headers || {},
        body: newRequest.body || ''
      });
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send request',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = async (
    name: string,
    collectionId: string | null,
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string
  ): Promise<void> => {
    setSaving(true);
    try {
      if (!name || !method || !url) {
        throw new Error("Name, method, and URL are required");
      }
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("User not authenticated");
      }
      const testData = {
        name,
        method,
        url,
        headers,
        body,
        collectionId,
        statusCode: responseStatus || undefined
      };
      const response = await fetch(`${API_BASE_URL}/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save test');
      }
      await loadCollections();
      toast({
        title: "Success",
        description: "Test saved successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error saving test:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save test",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const validateTestName = async (name: string, collectionId: string) => {
    try {
      return await apiValidateTestName(name, collectionId);
    } catch (error) {
      console.error('Error validating test name:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate test name',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    request,
    responseStatus,
    responseData,
    loading,
    saving,
    open,
    setOpen,
    collections,
    loadCollections,
    handleSendRequest,
    createCollection,
    handleSaveTest,
    validateTestName,
    currentRequest
  };
}
