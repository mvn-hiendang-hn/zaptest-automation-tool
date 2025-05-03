
import React from 'react';
import { TestRun } from '@/components/TestHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';

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

interface TestRunDetailsProps {
  selectedRun: TestRun;
  testResults: TestResult[];
  isLoadingResults: boolean;
  onBackToList: () => void;
}

const TestRunDetails: React.FC<TestRunDetailsProps> = ({
  selectedRun,
  testResults,
  isLoadingResults,
  onBackToList,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBackToList}>
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
              {formatDuration(selectedRun.duration)}
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
                          <TableCell>{formatDuration(result.duration)}</TableCell>
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
  );
};

export default TestRunDetails;
