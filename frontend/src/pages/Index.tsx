import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import RequestForm from '@/components/RequestForm';
import ResponseViewer from '@/components/ResponseViewer';
import SaveTestDialog from '@/components/SaveTestDialog';
import { useApiTesting } from '@/hooks/useApiTesting';
import { toast } from '@/components/ui/use-toast';

const Index: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { 
    responseStatus, 
    responseData, 
    loading,
    saving,
    open,
    setOpen,
    collections,
    loadCollections,
    handleSendRequest,
    createCollection,
    handleSaveTest,
    validateTestName,
    currentRequest
  } = useApiTesting(user?.id);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      loadCollections();
    }
  }, [user, navigate, loadCollections]);

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
        <SaveTestDialog
          open={open}
          onOpenChange={setOpen}
          onSave={handleSaveTest}
          saving={saving}
          collections={collections}
          onCreateCollection={createCollection}
          onValidateTestName={validateTestName}
          currentRequest={currentRequest}
        />
      </div>
    </div>
  );
};

export default Index;
