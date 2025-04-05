import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CollectionsList from '@/components/CollectionsList';
import CollectionForm from '@/components/CollectionForm';
import TestsList from '@/components/TestsList';
import ScheduleForm from '@/components/ScheduleForm';
import { useNavigate } from 'react-router-dom';
import AddTestToCollectionDialog from '@/components/AddTestToCollectionDialog';
import type { APICollection, SavedTest, ScheduleConfig, ApiTestData } from '@/types';
import { checkNameUniqueness, createApiTest } from '@/integrations/supabase/client';

const Collections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [collections, setCollections] = useState<APICollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<APICollection | null>(null);
  const [editingCollection, setEditingCollection] = useState<APICollection | null>(null);
  
  const [testsInCollection, setTestsInCollection] = useState<SavedTest[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showAddTestDialog, setShowAddTestDialog] = useState(false);
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
  
  const loadCollections = async () => {
    try {
      setIsLoadingCollections(true);
  
      const response = await fetch(
        `http://localhost:5000/api-collections?userId=${user!.id}&page=${currentPage}&pageSize=${pageSize}`
      );
  
      if (!response.ok) {
        throw new Error(`Error fetching collections: ${response.statusText}`);
      }
  
      const result = await response.json();
      
      // Format collections data
      const collectionsWithCounts = result.data.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        testCount: collection.testCount || 0, // Mặc định nếu testCount không có
      }));
  
      setCollections(collectionsWithCounts);
      setTotalItems(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: 'Error loading collections',
        description: 'There was an error loading your API collections.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCollections(false);
    }
  };
  
  
  const loadTestsForCollection = async (collectionId: string) => {
    try {
      setIsLoadingTests(true);
      
      const response = await fetch(
        `http://localhost:5000/api-tests/collectionId?collectionId=${collectionId}&page=${testsCurrentPage}&pageSize=${testsPageSize}`
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching tests: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const formattedTests: SavedTest[] = result.data.map((test: any) => ({
        id: test.id,
        name: test.name,
        timestamp: new Date(test.created_at).getTime(),
        request: {
          method: test.method,
          url: test.url,
          headers: test.headers ? 
            Object.entries(test.headers as Record<string, any>)
              .reduce((acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
              }, {} as Record<string, string>) : 
            {},
          body: test.body || ''
        },
        responseStatus: test.status_code || 0,
      }));
      
      setTestsInCollection(formattedTests);
      setTestsTotalItems(result.totalCount);
      setTestsTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading tests for collection:', error);
      toast({
        title: 'Error loading tests',
        description: 'There was an error loading tests for this collection.',
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
        throw new Error("You must be logged in to create a collection");
      }
  
      if (editingCollection) {
        // Cập nhật Collection
        const response = await fetch(`http://localhost:5000/api-collections/${editingCollection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to update collection");
        }
  
        const updatedCollection = await response.json();
  
        toast({
          title: "Collection updated",
          description: "Your API collection has been updated successfully.",
        });
  
        setCollections((prev) =>
          prev.map((c) =>
            c.id === editingCollection.id ? { ...c, name, description: description || null } : c
          )
        );
  
        setEditingCollection(null);
      } else {
        // Tạo Collection mới
        const response = await fetch("http://localhost:5000/api-collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            user_id: user.id,
            test_count: 0,
          }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to create collection");
        }
  
        const newCollection = await response.json();
  
        toast({
          title: "Collection created",
          description: "Your API collection has been created successfully.",
        });
  
        setCollections((prev) => [
          {
            id: newCollection.id,
            name: newCollection.name,
            description: newCollection.description,
            createdAt: new Date().getTime(),
            testCount: 0,
          },
          ...prev,
        ]);
      }
  
      setShowCollectionForm(false);
    } catch (error) {
      console.error("Error saving collection:", error);
      toast({
        title: "Error saving collection",
        description: "There was an error saving your collection.",
        variant: "destructive",
      });
    } finally {
      setSavingCollection(false);
    }
  };
  






  
  const handleDeleteCollection = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api-collections/${id}`, {
        method: 'DELETE',
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
        throw new Error("You must be logged in to run a collection");
      }
  
      // Fetch tests for the collection to get total tests count
      const testsResponse = await fetch(
        `http://localhost:5000/api-tests/collectionId?collectionId=${collectionId}`
      );
      
      if (!testsResponse.ok) {
        throw new Error("Failed to fetch tests for the collection");
      }
  
      const testsResult = await testsResponse.json();
      const totalTests = testsResult.data.length;
  
      const response = await fetch("http://localhost:5000/run-collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId,
          userId: user.id,
          // Optionally include total tests if your backend expects it
          totalTests: totalTests
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to run collection");
      }
  
      toast({
        title: "Collection Running",
        description: `Running ${totalTests} tests in the collection. Results will be available soon.`,
      });
  
      navigate("/history");
    } catch (error: any) {
      console.error("Error running collection:", error);
      toast({
        title: "Error Running Collection",
        description: error.message || "There was an error running the collection.",
        variant: "destructive",
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
    // try {
    //   setSavingSchedule(true);
      
    //   if (!user) {
    //     throw new Error('You must be logged in to create a schedule');
    //   }
      
    //   const selectedDaysAsNumbers = schedule.selectedDays.map(day => parseInt(day, 10));
      
    //   const { error } = await supabase
    //     .from('test_schedules')
    //     .insert({
    //       name: schedule.name,
    //       collection_id: schedule.collectionId,
    //       frequency: schedule.frequency,
    //       selected_days: selectedDaysAsNumbers,
    //       hour_interval: schedule.hourInterval,
    //       send_email: schedule.sendEmailReport,
    //       recipient_email: user.email,
    //       user_id: user.id
    //     });
      
    //   if (error) throw error;
      
    //   toast({
    //     title: 'Schedule created',
    //     description: 'Your API test schedule has been created successfully.',
    //   });
      
    //   setShowScheduleForm(false);
      
    //   navigate('/schedules');
    // } catch (error) {
    //   console.error('Error creating schedule:', error);
    //   toast({
    //     title: 'Error creating schedule',
    //     description: 'There was an error creating your schedule.',
    //     variant: 'destructive',
    //   });
    // } finally {
    //   setSavingSchedule(false);
    // }
  };
  
  const handleAddTest = () => {
    setEditingTest(null);
    setShowAddTestDialog(true);
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
    setShowAddTestDialog(true);
  };
  
  const handleSaveTest = async (testData: ApiTestData) => {
    try {
      setSavingTest(true);
  
      if (!user || !selectedCollectionId) {
        throw new Error("You must be logged in and have a collection selected");
      }
  
      const isUnique = await checkNameUniqueness(
        "api_tests",
        testData.name,
        testData.id || undefined
      );
  
      if (!isUnique) {
        toast({
          title: "Duplicate name",
          description: "A test with this name already exists. Please choose a different name.",
          variant: "destructive",
        });
        return;
      }
  
      const testToSave = {
        name: testData.name,
        method: testData.method,
        url: testData.url,
        headers: testData.headers,
        body: testData.body,
        response: "",
        status_code: 0,
        user_id: user.id,
        collection_id: selectedCollectionId,
      };
  
      if (testData.id) {
        const updatedTest = await fetch(`http://localhost:5000/api-tests/${testData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testToSave),
        }).then((res) => res.json());
  
        if (updatedTest.error) {
          throw new Error(updatedTest.error);
        }
  
        toast({
          title: "Test updated",
          description: "The API test has been updated successfully.",
        });
  
        setTestsInCollection((prev) =>
          prev.map((test) =>
            test.id === testData.id
              ? {
                  ...test,
                  name: testData.name,
                  request: {
                    method: testData.method,
                    url: testData.url,
                    headers: testData.headers,
                    body: testData.body,
                  },
                }
              : test
          )
        );
      } else {
        const newTest = await fetch("http://localhost:5000/api-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testToSave),
        }).then((res) => res.json());
  
        if (newTest.error) {
          throw new Error(newTest.error);
        }
  
        toast({
          title: "Test added",
          description: "The API test has been added to the collection.",
        });
  
        setTestsInCollection((prev) => [
          {
            id: newTest.id,
            name: newTest.name,
            timestamp: new Date(newTest.created_at).getTime(),
            request: {
              method: newTest.method,
              url: newTest.url,
              headers: newTest.headers,
              body: newTest.body || "",
            },
            responseStatus: newTest.status_code || 0,
          },
          ...prev,
        ]);
  
        setCollections((prev) =>
          prev.map((collection) =>
            collection.id === selectedCollectionId
              ? { ...collection, testCount: collection.testCount + 1 }
              : collection
          )
        );
      }
  
      setShowAddTestDialog(false);
      setEditingTest(null);
    } catch (error) {
      console.error("Error saving test:", error);
      toast({
        title: "Error saving test",
        description: "There was an error saving the API test.",
        variant: "destructive",
      });
    } finally {
      setSavingTest(false);
    }
  };
  
  
  const handleRemoveTest = async (id: string) => {
    // try {
    //   const { error } = await supabase
    //     .from('api_tests')
    //     .delete()
    //     .eq('id', id);
        
    //   if (error) {
    //     throw error;
    //   }
      
    //   toast({
    //     title: 'Test removed',
    //     description: 'The test has been removed from the collection.',
    //   });
      
    //   setTestsInCollection(prev => prev.filter(test => test.id !== id));
      
    //   if (selectedCollectionId) {
    //     setCollections(prev => 
    //       prev.map(collection => 
    //         collection.id === selectedCollectionId
    //           ? { ...collection, testCount: collection.testCount - 1 }
    //           : collection
    //       )
    //     );
    //   }
    // } catch (error) {
    //   console.error('Error removing test:', error);
    //   toast({
    //     title: 'Error removing test',
    //     description: 'There was an error removing the test.',
    //     variant: 'destructive',
    //   });
    // }
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
  
  const handleExportCollections = async () => {
    try {
      if (collections.length === 0) {
        toast({
          title: "No collections to export",
          description: "Please create some collections before exporting.",
          variant: "destructive",
        });
        return;
      }

      // Fetch all tests for each collection
      const collectionsWithTests = await Promise.all(
        collections.map(async (collection) => {
          try {
            const response = await fetch(
              `http://localhost:5000/api-tests/collectionId?collectionId=${collection.id}`
            );
            
            if (!response.ok) {
              throw new Error(`Failed to fetch tests for collection ${collection.name}`);
            }

            const result = await response.json();
            
            const tests = result.data.map((test: any) => ({
              id: test.id,
              name: test.name,
              method: test.method,
              url: test.url,
              headers: test.headers || {},
              body: test.body || '',
              status_code: test.status_code || 0,
              created_at: test.created_at
            }));

            return {
              id: collection.id,
              name: collection.name,
              description: collection.description,
              testCount: collection.testCount,
              tests: tests
            };
          } catch (error) {
            console.error(`Error fetching tests for collection ${collection.name}:`, error);
            return {
              id: collection.id,
              name: collection.name,
              description: collection.description,
              testCount: collection.testCount,
              tests: [],
              error: "Failed to fetch tests for this collection"
            };
          }
        })
      );

      // Tạo dữ liệu để export
      const exportData = {
        collections: collectionsWithTests,
        exportDate: new Date().toISOString(),
        totalCollections: collections.length,
        totalTests: collectionsWithTests.reduce((sum, collection) => sum + collection.tests.length, 0)
      };

      // Chuyển đổi thành JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Tạo blob và download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-collections-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Collections exported",
        description: `Successfully exported ${collections.length} collections with ${exportData.totalTests} tests.`,
      });
    } catch (error) {
      console.error("Error exporting collections:", error);
      toast({
        title: "Error exporting collections",
        description: "There was an error exporting your collections.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">API Collections</h1>
        <div className="flex gap-2">
          {!selectedCollectionId && (
            <>
              <Button onClick={handleExportCollections} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Collections
              </Button>
              <Button onClick={() => setShowCollectionForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </>
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
        open={showAddTestDialog}
        onClose={setShowAddTestDialog}
        onSave={handleSaveTest}
        saving={savingTest}
        test={editingTest || undefined}
      />
    </div>
  );
};

export default Collections;
