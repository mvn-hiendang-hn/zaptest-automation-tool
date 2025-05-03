import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CollectionsList from '@/components/CollectionsList';
import CollectionForm from '@/components/CollectionForm';
import TestsList from '@/components/TestsList';
import ScheduleForm from '@/components/ScheduleForm';
import { useNavigate } from 'react-router-dom';
import { AddTestToCollectionDialog } from '@/components/AddTestToCollectionDialog';
import type { APICollection, SavedTest, ScheduleConfig, ApiTestData } from '@/types';
import { API_BASE_URL } from '@/config/api';

const Collections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [collections, setCollections] = useState<APICollection[]>([]);
  const [isLoadingCollections, setLoadingCollections] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<APICollection | null>(null);
  const [editingCollection, setEditingCollection] = useState<APICollection | null>(null);
  
  const [testsInCollection, setTestsInCollection] = useState<SavedTest[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [isAddTestDialogOpen, setIsAddTestDialogOpen] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingTest, setSavingTest] = useState(false);
  const [runningCollection, setRunningCollection] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('collections');
  const [editingTest, setEditingTest] = useState<ApiTestData | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [testsCurrentPage, setTestsCurrentPage] = useState(1);
  const [testsPageSize, setTestsPageSize] = useState(10);
  const [testsTotalItems, setTestsTotalItems] = useState(0);
  const [testsTotalPages, setTestsTotalPages] = useState(1);
  
  const [testToAdd, setTestToAdd] = useState<ApiTestData | null>(null);
  
  const loadCollections = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingCollections(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/collections`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load collections');
      }

      const data = await response.json();
      setCollections(data.data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: 'Error loading collections',
        description: 'There was an error loading the collections list.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCollections(false);
    }
  };
  
  const loadTestsForCollection = async (collectionId: string) => {
    try {
      setIsLoadingTests(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/tests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load tests');
      }

      const data = await response.json();
      setTestsInCollection(data);
      setTestsTotalItems(data.length);
      setTestsTotalPages(1);
    } catch (error) {
      console.error('Error loading tests for collection:', error);
      toast({
        title: 'Lỗi tải tests',
        description: 'Có lỗi xảy ra khi tải danh sách tests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTests(false);
    }
  };
  
  const handleSaveCollection = async (name: string, description: string) => {
    try {
      setSavingCollection(true);
      
      if (!user) {
        throw new Error('You must be logged in to create a collection');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            description: description || null
          })
      });

      if (!response.ok) {
        throw new Error('Failed to save collection');
      }
      
      const data = await response.json();
      
      if (data && data.id) {
          toast({
            title: 'Collection created',
            description: 'Your API collection has been created successfully.',
          });
          
          setCollections(prevCollections => [...prevCollections, data]);
      }
      
      setShowCollectionForm(false);
    } catch (error) {
      console.error('Error saving collection:', error);
      toast({
        title: 'Error saving collection',
        description: 'There was an error saving your collection.',
        variant: 'destructive',
      });
    } finally {
      setSavingCollection(false);
    }
  };
  
  const handleDeleteCollection = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }
      
      toast({
        title: 'Collection deleted',
        description: 'The collection has been deleted successfully.',
      });
      
      setCollections(prev => prev.filter(collection => collection.id !== id));
      
      if (selectedCollectionId === id) {
        setSelectedCollectionId(null);
        setCurrentTab('collections');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: 'Error deleting collection',
        description: 'There was an error deleting the collection.',
        variant: 'destructive',
      });
    }
  };
  
  const handleRunCollection = async (collectionId: string) => {
    try {
      setRunningCollection(collectionId);
      
      if (!user) {
        throw new Error('You must be logged in to run a collection');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to run collection');
      }
      
      toast({
        title: 'Success',
        description: 'Collection has been run successfully.',
      });
      
      navigate('/history');
    } catch (error: any) {
      console.error('Error running collection:', error);
      toast({
        title: 'Error running collection',
        description: error.message || 'There was an error running the collection.',
        variant: 'destructive',
      });
    } finally {
      setRunningCollection(null);
    }
  };
  
  const handleScheduleCollection = (id: string) => {
    setSelectedCollectionId(id);
    setShowScheduleForm(true);
  };
  
  const handleSaveSchedule = async (schedule: ScheduleConfig) => {
    try {
      setSavingSchedule(true);
      
      if (!user) {
        throw new Error('You must be logged in to create a schedule');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Prepare the request body with all possible fields
      const requestBody: any = {
        name: schedule.name,
        collectionId: selectedCollectionId || schedule.collectionId,
        frequency: schedule.frequency,
        selectedDays: schedule.selectedDays,
        sendEmailReport: schedule.sendEmailReport,
        recipientEmail: user.email
      };
      
      // Add timer type specific fields
      if (schedule.timerType) {
        requestBody.timerType = schedule.timerType;
        
        if (schedule.timerType === 'minute' && schedule.minuteInterval) {
          requestBody.minuteInterval = schedule.minuteInterval;
        } else if (schedule.timerType === 'hour' && schedule.hourInterval) {
          requestBody.hourInterval = schedule.hourInterval;
        } else if (schedule.timerType === 'day' && schedule.dayTime) {
          requestBody.dayTime = schedule.dayTime;
        } else if (schedule.timerType === 'week') {
          if (schedule.weekDay) requestBody.weekDay = schedule.weekDay;
          if (schedule.weekTime) requestBody.weekTime = schedule.weekTime;
        }
      }
      
      // Add id if editing an existing schedule
      if (schedule.id) {
        requestBody.id = schedule.id;
      }
      
      console.log('Sending schedule data:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create schedule');
      }
      
      toast({
        title: 'Schedule created',
        description: 'Your API test schedule has been created successfully.',
      });
      
      setShowScheduleForm(false);
      
      navigate('/schedules');
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Error creating schedule',
        description: error instanceof Error ? error.message : 'There was an error creating your schedule.',
        variant: 'destructive',
      });
    } finally {
      setSavingSchedule(false);
    }
  };
  
  const handleAddTest = () => {
    setEditingTest(null);
    setIsAddTestDialogOpen(true);
  };
  
  const handleEditTest = (test: SavedTest) => {
    setEditingTest({
      id: test.id,
      name: test.name,
      method: test.request.method,
      url: test.request.url,
      headers: test.request.headers,
      body: test.request.body
    });
    setIsAddTestDialogOpen(true);
  };
  
  const handleSaveTest = async (test: ApiTestData) => {
    try {
      setSavingTest(true);
      
      if (!selectedCollectionId) {
        throw new Error('No collection selected');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const method = editingTest ? 'PUT' : 'POST';
      const url = editingTest 
        ? `${API_BASE_URL}/tests/${editingTest.id}`
        : `${API_BASE_URL}/tests`;
      
      const requestBody = {
        ...test,
        collectionId: selectedCollectionId
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to save test');
      }
      
      const data = await response.json();
      
      if (data && data.id) {
        toast({
          title: editingTest ? 'Test updated' : 'Test created',
          description: editingTest 
            ? 'Your API test has been updated successfully.'
            : 'Your API test has been created successfully.',
        });
        
        // Reload tests to get the latest data
        await loadTestsForCollection(selectedCollectionId);
        // Also reload collections to update test count
        await loadCollections();
        
        // Đóng dialog và reset state
        setIsAddTestDialogOpen(false);
        setEditingTest(null);
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: 'Error saving test',
        description: 'There was an error saving your test.',
        variant: 'destructive',
      });
    } finally {
      setSavingTest(false);
    }
  };
  
  const handleRemoveTest = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/tests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove test');
      }
      
      toast({
        title: 'Test removed',
        description: 'The test has been removed from the collection.',
      });
      
      setTestsInCollection(prev => prev.filter(test => test.id !== id));
      
      if (selectedCollectionId) {
        setCollections(prev => 
          prev.map(collection => 
            collection.id === selectedCollectionId
              ? { ...collection, testCount: collection.testCount - 1 }
              : collection
          )
        );
      }
    } catch (error) {
      console.error('Error removing test:', error);
      toast({
        title: 'Error removing test',
        description: error instanceof Error ? error.message : 'There was an error removing the test.',
        variant: 'destructive',
      });
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleTestsPageChange = (page: number) => {
    setTestsCurrentPage(page);
  };

  const handleTestsPageSizeChange = (size: number) => {
    setTestsPageSize(size);
    setTestsCurrentPage(1);
  };
  
  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user, currentPage, pageSize]);
  
  useEffect(() => {
    if (selectedCollectionId) {
      loadTestsForCollection(selectedCollectionId);
      
      const collection = collections.find(c => c.id === selectedCollectionId) || null;
      setSelectedCollection(collection);
      
      if (collection && currentTab === 'collections') {
        setCurrentTab('tests');
      }
    } else {
      setTestsInCollection([]);
      setSelectedCollection(null);
    }
  }, [selectedCollectionId, collections]);
  
  useEffect(() => {
    if (selectedCollectionId) {
      loadTestsForCollection(selectedCollectionId);
    }
  }, [selectedCollectionId, testsCurrentPage, testsPageSize]);
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">API Collections</h1>
        <div className="flex gap-2">
          {!selectedCollectionId && (
            <Button onClick={() => setShowCollectionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          )}
        </div>
      </div>
      
      {showCollectionForm ? (
        <div className="mb-6">
          <CollectionForm
            onSave={handleSaveCollection}
            onCancel={() => setShowCollectionForm(false)}
            collection={editingCollection || undefined}
            saving={savingCollection}
          />
        </div>
      ) : showScheduleForm && selectedCollection ? (
        <div className="mb-6">
          <ScheduleForm
            onSave={handleSaveSchedule}
            onCancel={() => setShowScheduleForm(false)}
            collections={collections}
            saving={savingSchedule}
            defaultCollectionId={selectedCollectionId}
          />
        </div>
      ) : (
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            {selectedCollectionId && (
              <TabsTrigger value="tests">Tests in Collection</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="collections" className="mt-4">
            <CollectionsList
              collections={collections}
              isLoading={isLoadingCollections}
              onSelectCollection={setSelectedCollectionId}
              onDeleteCollection={handleDeleteCollection}
              onRunCollection={handleRunCollection}
              onScheduleCollection={handleScheduleCollection}
              selectedCollectionId={selectedCollectionId || undefined}
              runningCollectionId={runningCollection || undefined}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </TabsContent>
          
          {selectedCollectionId && (
            <TabsContent value="tests" className="mt-4">
              {selectedCollection && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">
                    Tests in: {selectedCollection.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedCollection.description || 'No description provided'}
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={handleAddTest}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add API Test
                    </Button>
                  </div>
                </div>
              )}
              
              <TestsList
                savedTests={testsInCollection}
                isLoading={isLoadingTests}
                onRemoveTest={handleRemoveTest}
                onEditTest={handleEditTest}
                currentPage={testsCurrentPage}
                totalPages={testsTotalPages}
                pageSize={testsPageSize}
                totalItems={testsTotalItems}
                onPageChange={handleTestsPageChange}
                onPageSizeChange={handleTestsPageSizeChange}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
      
      <AddTestToCollectionDialog
        open={isAddTestDialogOpen}
        onClose={() => setIsAddTestDialogOpen(false)}
        onSave={handleSaveTest}
        saving={savingTest}
        test={editingTest || undefined}
        selectedCollectionId={selectedCollectionId || undefined}
        onSuccess={() => {
          setIsAddTestDialogOpen(false);
          loadTestsForCollection(selectedCollectionId!);
        }}
        onOpenChange={setIsAddTestDialogOpen}
      />
    </div>
  );
};

export default Collections;
