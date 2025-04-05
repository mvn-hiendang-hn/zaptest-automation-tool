
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, Clock, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PaginationControl from '@/components/ui/pagination-control';

export interface TestRun {
  id: string;
  collectionId: string;
  collectionName: string;
  timestamp: number;
  status: 'completed' | 'failed' | 'running';
  totalTests: number;
  successCount: number;
  failureCount: number;
  duration: number; // in milliseconds
}

export interface TestHistoryProps {
  testRuns: TestRun[];
  isLoading: boolean;
  onViewDetails: (runId: string) => void;
  // Pagination props
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const TestHistory: React.FC<TestHistoryProps> = ({
  testRuns,
  isLoading,
  onViewDetails,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}) => {
  // Prepare data for chart
  const chartData = testRuns.slice(0, 10).reverse().map(run => ({
    name: new Date(run.timestamp).toLocaleDateString(),
    success: run.successCount,
    failure: run.failureCount,
    total: run.totalTests,
    successRate: Math.round((run.successCount / run.totalTests) * 100)
  }));

  console.log("TestHistory - testRuns:", testRuns, "isLoading:", isLoading);


  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-md p-4">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  if (testRuns.length === 0) {
 
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No test runs found.</p>
        </CardContent>
      </Card>
    );
  }
  console.log("TestHistory - testRuns:", testRuns, "isLoading:", isLoading);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Results Over Time</CardTitle>
          <CardDescription>Success and failure rates from your most recent test runs</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[0, 100]} 
                unit="%" 
              />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="success" 
                name="Successful Tests" 
                fill="#10b981" 
                stackId="a" 
              />
              <Bar 
                yAxisId="left" 
                dataKey="failure" 
                name="Failed Tests" 
                fill="#ef4444" 
                stackId="a" 
              />
              <Bar 
                yAxisId="right" 
                dataKey="successRate" 
                name="Success Rate" 
                fill="#3b82f6" 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div>
        <Table>
          <TableCaption>A history of your test runs</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Collection</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testRuns.map((run) => {
              const successRate = Math.round((run.successCount / run.totalTests) * 100);
              return (
                <TableRow 
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDetails(run.id)}
                >
                  <TableCell>{run.collectionName}</TableCell>
                  <TableCell>
                    {new Date(run.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {run.status === 'completed' ? (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    ) : run.status === 'running' ? (
                      <Badge className="bg-blue-500">
                        <Clock className="h-3 w-3 mr-1 animate-spin" /> Running
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" /> Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className={`h-2.5 rounded-full ${
                            successRate > 80 ? 'bg-green-500' : 
                            successRate > 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${successRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{successRate}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {run.successCount}/{run.totalTests} tests passed
                    </div>
                  </TableCell>
                  <TableCell>
                    {(run.duration / 1000).toFixed(2)}s
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
};

export default TestHistory;
