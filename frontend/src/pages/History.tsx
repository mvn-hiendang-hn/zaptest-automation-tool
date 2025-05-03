import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TestHistory from '@/components/TestHistory';
import TestRunDetails from '@/components/TestRunDetails';
import { useTestRunData } from '@/hooks/useTestRunData';

const History = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runId = searchParams.get('runId');
  
  const {
    testRuns,
    isLoadingRuns,
    selectedRun,
    testResults,
    isLoadingResults,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    handleViewDetails,
    handleBackToList,
    handlePageChange,
    handlePageSizeChange
  } = useTestRunData({ userId: user?.id });

  useEffect(() => {
    if (runId) {
      handleViewDetails(runId);
    }
  }, [runId, handleViewDetails]);

  const handleBack = () => {
    handleBackToList();
    navigate('/history');
  };
  
  return (
    <div className="container mx-auto py-10">
      {selectedRun ? (
        <TestRunDetails
          selectedRun={selectedRun}
          testResults={testResults}
          isLoadingResults={isLoadingResults}
          onBackToList={handleBack}
        />
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
            totalItems={testRuns.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
};

export default History;
