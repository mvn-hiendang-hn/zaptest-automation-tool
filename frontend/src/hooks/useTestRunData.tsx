import { useState, useEffect } from 'react';
import { TestRun } from '@/components/TestHistory';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/config/api';

interface TestResult {
  id: string;
  testId: string;
  testName: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  error?: string;
}

interface UseTestRunDataParams {
  userId: string | undefined;
}

export function useTestRunData({ userId }: UseTestRunDataParams) {
  const { toast } = useToast();
  
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const loadTestRuns = async () => {
    if (!userId) return;
    
    try {
      setIsLoadingRuns(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/test-runs?page=${currentPage}&pageSize=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load test runs');
      }

      const data = await response.json();
      
      const formattedRuns: TestRun[] = data.runs.map((run: any) => ({
        id: run.id,
        collectionId: run.collectionId || '',
        collectionName: run.collectionName || 'Unknown Collection',
        timestamp: new Date(run.createdAt).getTime(),
        status: run.status === 'completed' ? 'completed' : 
               run.status === 'running' || run.status === 'in_progress' ? 'running' : 'failed',
        totalTests: run.totalTests || 0,
        successCount: run.successCount || 0,
        failureCount: run.failureCount || 0,
        duration: run.duration || 0
      }));
      
      setTestRuns(formattedRuns);
      setTotalItems(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading test runs:', error);
      toast({
        title: 'Lỗi tải lịch sử test',
        description: 'Có lỗi xảy ra khi tải lịch sử chạy test.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRuns(false);
    }
  };
  
  const loadTestDetails = async (runId: string) => {
    try {
      setIsLoadingResults(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/test-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load test run details');
      }

      const data = await response.json();
      
      const formattedRun: TestRun = {
        id: data.run.id,
        collectionId: data.run.collectionId || '',
        collectionName: data.run.collectionName || 'Unknown Collection',
        timestamp: new Date(data.run.createdAt).getTime(),
        status: data.run.status === 'completed' ? 'completed' : 
               data.run.status === 'running' || data.run.status === 'in_progress' ? 'running' : 'failed',
        totalTests: data.run.totalTests || 0,
        successCount: data.run.successCount || 0,
        failureCount: data.run.failureCount || 0,
        duration: data.run.duration || 0
      };

      setSelectedRun(formattedRun);
      setTestResults(data.results);
    } catch (error) {
      console.error('Error loading test run details:', error);
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin chạy test.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingResults(false);
    }
  };
  
  useEffect(() => {
    loadTestRuns();
  }, [userId, currentPage, pageSize]);
  
  useEffect(() => {
    if (selectedRunId) {
      loadTestDetails(selectedRunId);
    }
  }, [selectedRunId]);
  
  const handleViewDetails = (runId: string) => {
    setSelectedRunId(runId);
  };
  
  const handleBackToList = () => {
    setSelectedRunId(null);
    setSelectedRun(null);
    setTestResults([]);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  
  return {
    testRuns,
    isLoadingRuns,
    selectedRun,
    testResults,
    isLoadingResults,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    handleViewDetails,
    handleBackToList,
    handlePageChange,
    handlePageSizeChange
  };
}
