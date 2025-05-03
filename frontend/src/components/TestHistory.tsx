import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, Clock, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend
} from 'chart.js';
import PaginationControl from '@/components/ui/pagination-control';
import { formatDuration } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend
);

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
  const navigate = useNavigate();
  
  // Prepare data for bar chart
  const barChartData = testRuns.slice(0, 10).reverse().map(run => {
    const successRate = run.totalTests > 0 
      ? Math.round((run.successCount / run.totalTests) * 100) 
      : 0;
    
    return {
      name: new Date(run.timestamp).toLocaleDateString(),
      success: run.successCount,
      failure: run.failureCount,
      total: run.totalTests,
      successRate: successRate
    };
  });

  // Prepare data for line chart - last 10 runs in chronological order
  const lineChartData = {
    labels: testRuns
      .slice(-10)
      .map(run => new Date(run.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Execution Time (seconds)',
        data: testRuns
          .slice(-10)
          .map(run => run.duration / 1000), // Convert ms to seconds
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(2)} seconds`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (seconds)'
        }
      }
    }
  };

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
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Results Over Time</CardTitle>
          <CardDescription>Success and failure rates from your most recent test runs</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
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

      <Card>
        <CardHeader>
          <CardTitle>Collection Run Times</CardTitle>
          <CardDescription>Execution duration trend of your recent collection runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line options={lineChartOptions} data={lineChartData} />
          </div>
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
              const successRate = run.totalTests > 0 
                ? Math.round((run.successCount / run.totalTests) * 100)
                : 0;
                
              return (
                <TableRow 
                  key={run.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    navigate(`/history?runId=${run.id}`);
                  }}
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
                    {formatDuration(run.duration)}
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
