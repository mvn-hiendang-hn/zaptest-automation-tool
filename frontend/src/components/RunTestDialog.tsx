
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SavedTest } from './TestsList';
import { runSingleTest } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Play } from 'lucide-react';

interface RunTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: SavedTest | null;
  onSuccess?: () => void;
}

const RunTestDialog: React.FC<RunTestDialogProps> = ({
  open,
  onOpenChange,
  test,
  onSuccess
}) => {
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const handleRun = async () => {
    if (!test) return;
    
    try {
      setRunning(true);
      await runSingleTest(test.id, ''); // User ID will be added by the server function
      
      toast({
        title: 'Test running',
        description: `The test "${test.name}" is now running. Results will be available soon.`,
      });
      
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error running test:', error);
      toast({
        title: 'Error running test',
        description: 'There was an error running the test.',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run API Test</DialogTitle>
          <DialogDescription>
            {test ? `Are you sure you want to run the test "${test.name}"?` : 'Select a test to run'}
          </DialogDescription>
        </DialogHeader>
        
        {test && (
          <div className="space-y-2 py-4">
            <div className="rounded-md bg-muted p-4">
              <div className="text-sm font-medium">Method: {test.request.method}</div>
              <div className="mt-1 text-sm break-all">URL: {test.request.url}</div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRun} 
            disabled={running || !test}
          >
            {running ? 'Running...' : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RunTestDialog;
