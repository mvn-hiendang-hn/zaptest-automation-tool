import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TestHistory from '@/components/TestHistory';
import TestsList from '@/components/TestsList';
import { formatDistanceToNow } from 'date-fns';
import { SavedTest, TestRun } from '@/types';

interface TestHistoryRun {
  id: string;
  collectionId: string;
  collectionName: string;
  timestamp: number;
  status: 'completed' | 'running' | 'failed';
  totalTests: number;
  successCount: number;
  failureCount: number;
  duration: number;
}

interface HistoryPanelProps {
  userId: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ userId }) => {
  const [testRuns, setTestRuns] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<any>(null);
  const [isLoadingRunDetails, setIsLoadingRunDetails] = useState(false);

  useEffect(() => {
    const fetchTestRuns = async () => {
      setIsLoadingHistory(true);
      try {
        const mockTestRuns = [
          {
            id: '1',
            collection_id: 'collection1',
            collection_name: 'API Collection 1',
            created_at: new Date(),
            status: 'completed',
            total_tests: 10,
            success_count: 8,
            failure_count: 2,
            total_duration: 60000,
          },
          {
            id: '2',
            collection_id: 'collection2',
            collection_name: 'API Collection 2',
            created_at: new Date(Date.now() - 86400000),
            status: 'failed',
            total_tests: 5,
            success_count: 3,
            failure_count: 2,
            total_duration: 30000,
          },
        ];
        setTestRuns(mockTestRuns);
      } catch (error) {
        console.error('Failed to fetch test runs:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchTestRuns();
  }, [userId]);

  const handleViewRunDetails = async (runId: string) => {
    setIsLoadingRunDetails(true);
    try {
      const mockRunDetails = {
        id: runId,
        collection_id: 'collection1',
        collection_name: 'API Collection 1',
        created_at: new Date(),
        status: 'completed',
        total_tests: 10,
        success_count: 8,
        failure_count: 2,
        total_duration: 60000,
        test_results: [
          {
            id: 'test1',
            test_name: 'Test 1',
            status: 'success',
            duration: 3000,
          },
          {
            id: 'test2',
            test_name: 'Test 2',
            status: 'failed',
            duration: 3000,
          },
        ],
      };
      setSelectedRunDetails(mockRunDetails);
    } catch (error) {
      console.error('Failed to fetch run details:', error);
    } finally {
      setIsLoadingRunDetails(false);
    }
  };

  const mappedTestRuns: TestHistoryRun[] = testRuns.map(run => ({
    id: run.id,
    collectionId: run.collection_id || '',
    collectionName: run.collection_name || 'Unknown Collection',
    timestamp: run.created_at 
      ? new Date(run.created_at).getTime() 
      : Date.now(),
    status: run.status as 'completed' | 'running' | 'failed',
    totalTests: run.total_tests || 0,
    successCount: run.success_count || 0,
    failureCount: run.failure_count || 0,
    duration: run.total_duration || 0
  }));

  const handleRemoveTest = async (id: string): Promise<void> => {
    console.log(`Removing test with ID: ${id}`);
    return Promise.resolve();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="runs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="runs">Test Runs</TabsTrigger>
          <TabsTrigger value="tests">Saved Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="runs" className="space-y-6">
          {selectedRunId && selectedRunDetails ? (
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => setSelectedRunId(null)}
                  className="text-blue-500 hover:underline flex items-center"
                >
                  ← Back to Test Runs
                </button>
                
                <div className="mt-4 bg-card rounded-lg p-4 border">
                  <h3 className="text-lg font-medium">
                    Run Details: {selectedRunDetails.collection_name || 'Unknown Collection'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {selectedRunDetails.status === 'completed' ? '✅ Complete' : 
                         selectedRunDetails.status === 'running' ? '⏳ Running' : '❌ Failed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {selectedRunDetails.total_duration ? `${(selectedRunDetails.total_duration / 1000).toFixed(2)}s` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Run Time</p>
                      <p className="font-medium">
                        {selectedRunDetails.created_at ? 
                          `${new Date(selectedRunDetails.created_at).toLocaleString()} (${formatDistanceToNow(new Date(selectedRunDetails.created_at), { addSuffix: true })})` 
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium">
                        {selectedRunDetails.total_tests ? 
                          `${Math.round((selectedRunDetails.success_count / selectedRunDetails.total_tests) * 100)}% (${selectedRunDetails.success_count}/${selectedRunDetails.total_tests})` 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRunDetails.test_results && selectedRunDetails.test_results.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Test Results</h3>
                  <TestsList
                    savedTests={selectedRunDetails.test_results}
                    isLoading={false}
                    onRemoveTest={handleRemoveTest}
                    onSelectTest={() => {}}
                    onEditTest={() => {}}
                    onRunTest={() => {}}
                    currentPage={1}
                    totalPages={1}
                    pageSize={10}
                    totalItems={selectedRunDetails.test_results.length}
                    onPageChange={() => {}}
                    onPageSizeChange={() => {}}
                  />
                </div>
              )}
            </div>
          ) : (
            <TestHistory 
              testRuns={mappedTestRuns as any}
              isLoading={isLoadingHistory}
              onViewDetails={handleViewRunDetails}
              currentPage={1}
              totalPages={1}
              pageSize={10}
              totalItems={mappedTestRuns.length}
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
            />
          )}
        </TabsContent>
        
        <TabsContent value="tests">
          <TestsList 
            savedTests={[]}
            isLoading={isLoadingHistory}
            onRemoveTest={handleRemoveTest}
            currentPage={1}
            totalPages={1}
            pageSize={10}
            totalItems={0}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryPanel;
