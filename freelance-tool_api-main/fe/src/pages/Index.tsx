
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import RequestForm from '@/components/RequestForm';
import ResponseViewer from '@/components/ResponseViewer';
import TestsList from '@/components/TestsList';
import SaveTestDialog from '@/components/SaveTestDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { RequestConfig, SavedTest } from '@/types';
import { checkNameUniqueness, createApiTest, deleteApiTest, getApiCollections } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();

  const { toast } = useToast();
  const navigate = useNavigate();
  
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
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      loadTests();
      loadCollections();
    }
  }, [user, navigate, currentPage, pageSize]);

  const loadTests = async () => {
    try {
      setIsLoading(true);
  
      const response = await fetch(
        `http://localhost:5000/api-tests?userId=${user?.id}&page=${currentPage}&pageSize=${pageSize}`
      );
      
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch API tests");
      }
  
      if (result.data) {
        console.log(result.data);
        const formattedTests: SavedTest[] = result.data.map((test: any) => ({
          
          id: test.id,
          name: test.name,
          timestamp: new Date(test.created_at).getTime(),
          request: {
            method: test.method,
            url: test.url,
            headers: test.headers
              ? Object.entries(test.headers as Record<string, any>).reduce(
                  (acc, [key, value]) => {
                    acc[key] = String(value);
                    return acc;
                  },
                  {} as Record<string, string>
                )
              : {},
            body: test.body || '',
          },
          responseStatus: test.status_code || 0,
        }));

     
  
        setSavedTests(formattedTests);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      toast({
        title: 'Error loading tests',
        description: 'There was an error loading your saved tests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  const loadCollections = async () => {
    try {
      if (!user?.id) {
        throw new Error("User ID is required");
      }
  
      const response = await fetch(`http://localhost:5000/api-collections?userId=${user.id}`);
  
      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }
  
      const result = await response.json();
      setCollections(result.data || []);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  };
  

  const handleSendRequest = async (requestConfig: RequestConfig) => {
    setLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    setRequest(requestConfig);

    try {
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        body: requestConfig.body || undefined,
      });

      const data = await response.json();
      setResponseStatus(response.status);
      setResponseData(data);
    } catch (error: any) {
      console.error('Request failed:', error);
      setResponseStatus(500);
      setResponseData({ error: error.message });
      toast({
        title: 'Request failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = async (name: string) => {
    if (!name) {
      toast({
        title: 'Missing name',
        description: 'Please enter a name for your test.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      const unique = checkNameUniqueness('api_tests', name);
      if (!unique) {
        toast({
          title: 'Name already exists',
          description: 'Please enter a unique name for your test.',
          variant: 'destructive',
        });
        return;
      }
      
      const headersObject = Object.entries(request.headers || {}).reduce((acc, [key, value]) => {
        if (key.trim()) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const { data, error } = await createApiTest({
        name,
        user_id: user?.id,
        method: request.method,
        url: request.url,
        headers: headersObject,
        body: request.body,
        status_code: responseStatus,
        collection_id: selectedCollectionId,
        response: responseData
      });

      if (error) {
        throw error;
      }
    


      toast({
        title: 'Test saved',
        description: selectedCollectionId 
          ? 'Your API test has been saved and added to the collection.'
          : 'Your API test has been saved successfully.',
      });

      // const newTest: SavedTest = {
      //   id: data![0].id,
      //   name,
      //   timestamp: Date.now(),
      //   request: {
      //     method: request.method,
      //     url: request.url,
      //     headers: headersObject,
      //     body: request.body,
      //   },
      //   responseStatus: responseStatus || 0,
      // };

     
      setOpen(false);
      
      setSelectedCollectionId(null);
    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: 'Error saving test',
        description: 'There was an error saving your test.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTest = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await deleteApiTest(id);

      if (error) {
        throw error;
      }

      setSavedTests(prev => prev.filter(test => test.id !== id));

      toast({
        title: 'Test removed',
        description: 'Your API test has been removed successfully.',
      });
    } catch (error) {
      console.error('Error removing test:', error);
      toast({
        title: 'Error removing test',
        description: 'There was an error removing your test.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-10">
      <Toaster />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RequestForm 
          onSendRequest={handleSendRequest} 
          loading={loading}
        />
        <ResponseViewer 
          responseStatus={responseStatus} 
          responseData={responseData}
          onSaveClick={() => setOpen(true)}
        />
      </div>

      <SaveTestDialog
        open={open}
        onOpenChange={setOpen}
        onSave={handleSaveTest}
        saving={saving}
        customContent={
          collections.length > 0 && (
            <div className="mb-4 mt-2">
              <Label htmlFor="collection-select" className="text-sm font-medium mb-1 block">
                Add to Collection (optional)
              </Label>
              <Select 
                value={selectedCollectionId || ''} 
                onValueChange={(value) => setSelectedCollectionId(value || null)}
              >
                <SelectTrigger id="collection-select">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                {collections.length === 0 ? (
  <SelectItem value="">No collection</SelectItem>
) : (
  collections.map(collection => (
    <SelectItem key={collection.id} value={collection.id}>
      {collection.name}
    </SelectItem>
  ))
)}

                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      <div className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Saved Tests</h2>
        <TestsList 
          savedTests={savedTests} 
          isLoading={isLoading}
          onRemoveTest={handleRemoveTest}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
};

export default Index;
