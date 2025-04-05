
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

import { useToast } from '@/components/ui/use-toast';
import TestHistory, { TestRun } from '@/components/TestHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react';

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

const History = () => {
  const { user } = useAuth();
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
  
  useEffect(() => {
    if (user) {
      loadTestRuns();
    }
  }, [user, currentPage, pageSize]);
  
  useEffect(() => {
    if (selectedRunId) {
      loadTestDetails(selectedRunId);
    } else {
      setTestResults([]);
      setSelectedRun(null);
    }
  }, [selectedRunId]);
  
  const loadTestRuns = async () => {
    if (!user) return;
    
    try {
      setIsLoadingRuns(true);
  
      // Gọi API trực tiếp đến endpoint `/test-run-history`
      const response = await fetch(`http://localhost:5000/test-run-history?userId=${user.id}&page=${currentPage}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch test run history");
      }
  
      const runsData = await response.json();
  
      // Định dạng dữ liệu cho frontend
      const formattedRuns: TestRun[] = runsData.data.map(run => ({
        id: run.id,
        collectionId: run.collection_id || '',
        collectionName: run.collection_name || 'Unknown Collection',
        timestamp: new Date(run.created_at || '').getTime(),
        status: run.status === 'completed' ? 'completed' : 
               run.status === 'running' || run.status === 'in_progress' ? 'running' : 'failed',
        totalTests: run.total_tests || 0,
        successCount: run.success_count || 0,
        failureCount: run.failure_count || 0,
        duration: run.total_duration || 0
      }));
  
      setTestRuns(formattedRuns);
      setTotalItems(runsData.totalCount);
      setTotalPages(runsData.totalPages);
    } catch (error) {
      console.error('Error loading test runs:', error);
      toast({
        title: 'Error loading test history',
        description: 'There was an error loading your test run history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRuns(false);
    }
  };
  
  
  const loadTestDetails = async (runId: string) => {
    try {
      setIsLoadingResults(true);
      
      const res = await fetch(`http://localhost:5000/test-run-details/${runId}`);

      if (!res.ok) {
        throw new Error("Failed to fetch test run details");
      }
      const {run, results} = await res.json();
    
      
      if (!run) {
        toast({
          title: 'Error',
          description: 'Test run not found.',
          variant: 'destructive',
        });
        return;
      }
      
      const formattedRun: TestRun = {
        id: run.id,
        collectionId: run.collection_id || '',
        collectionName: run.collection_name || 'Unknown Collection',
        timestamp: new Date(run.created_at || '').getTime(),
        status: run.status === 'completed' ? 'completed' : 
               run.status === 'running' || run.status === 'in_progress' ? 'running' : 'failed',
        totalTests: run.total_tests || 0,
        successCount: run.success_count || 0,
        failureCount: run.failure_count || 0,
        duration: run.total_duration || 0
      };
      
      setSelectedRun(formattedRun);
      
      const formattedResults: TestResult[] = results.map(result => ({
        id: result.id,
        testId: result.test_id || '',
        testName: result.test_name || 'Unknown Test',
        method: result.test_method || 'GET',
        url: result.test_url || '',
        statusCode: result.status_code || 0,
        duration: result.duration || 0,
        error: result.error || undefined
      }));
      
      setTestResults(formattedResults);
    } catch (error) {
      console.error('Error loading test details:', error);
      toast({
        title: 'Error loading test details',
        description: 'There was an error loading the details for this test run.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingResults(false);
    }
  };
  
  const handleViewDetails = (runId: string) => {
    setSelectedRunId(runId);
  };
  
  const handleBackToList = () => {
    setSelectedRunId(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  return (
    <div className="container mx-auto py-10">
      {selectedRunId && selectedRun ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
            
            <h1 className="text-2xl font-bold tracking-tight">
              {selectedRun.collectionName} Run Details
            </h1>
            
            {selectedRun.status === 'running' && (
              <Badge className="bg-blue-500 ml-auto">
                <Clock className="h-3 w-3 mr-1 animate-spin" /> Running
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {selectedRun.totalTests === 0 ? 0 : 
                    Math.round((selectedRun.successCount / selectedRun.totalTests) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedRun.successCount} of {selectedRun.totalTests} tests passed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(selectedRun.duration / 1000).toFixed(2)}s
                </div>
                <p className="text-sm text-muted-foreground">
                  Total execution time
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Timestamp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-medium">
                  {new Date(selectedRun.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Detailed results for each API test in this run
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingResults ? (
                <div className="py-4 text-center">
                  <Clock className="h-8 w-8 mx-auto animate-spin mb-2 text-primary" />
                  <p>Loading test results...</p>
                </div>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Tests</TabsTrigger>
                    <TabsTrigger value="failed">Failed Tests</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResults.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              No test results found
                            </TableCell>
                          </TableRow>
                        ) : (
                          testResults.map((result) => (
                            <TableRow key={result.id}>
                              <TableCell>{result.testName}</TableCell>
                              <TableCell>{result.method}</TableCell>
                              <TableCell className="truncate max-w-xs">{result.url}</TableCell>
                              <TableCell>
                                <Badge className={result.statusCode >= 200 && result.statusCode < 300 
                                  ? 'bg-green-500' 
                                  : 'bg-red-500'
                                }>
                                  {result.statusCode || 'Error'}
                                </Badge>
                              </TableCell>
                              <TableCell>{result.duration}ms</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="failed" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResults
                          .filter(result => result.statusCode < 200 || result.statusCode >= 300 || !result.statusCode)
                          .length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4">
                                No failed tests found
                              </TableCell>
                            </TableRow>
                          ) : (
                            testResults
                              .filter(result => result.statusCode < 200 || result.statusCode >= 300 || !result.statusCode)
                              .map((result) => (
                                <TableRow key={result.id}>
                                  <TableCell>{result.testName}</TableCell>
                                  <TableCell>{result.method}</TableCell>
                                  <TableCell className="truncate max-w-xs">{result.url}</TableCell>
                                  <TableCell>
                                    <Badge variant="destructive">
                                      {result.statusCode || 'Error'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{result.error || 'Unknown error'}</TableCell>
                                </TableRow>
                              ))
                          )
                        }
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold tracking-tight mb-6">Test History</h1>
          <TestHistory
            testRuns={testRuns}
            isLoading={isLoadingRuns}
            onViewDetails={handleViewDetails}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
};

export default History;
