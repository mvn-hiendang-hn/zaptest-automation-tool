import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SaveTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, collectionId: string | null, method: string, url: string, headers: Record<string, string>, body: string) => Promise<void>;
  saving: boolean;
  collections: { id: string; name: string }[];
  onCreateCollection: (name: string, description: string) => Promise<string | null>;
  onValidateTestName: (name: string, collectionId: string) => Promise<boolean>;
  currentRequest: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  };
}

const SaveTestDialog: React.FC<SaveTestDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  saving,
  collections,
  onCreateCollection,
  onValidateTestName,
  currentRequest
}) => {
  const [name, setName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName('');
      setSelectedCollectionId(null);
      setShowCreateCollection(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setNameError(null);
    }
  }, [open]);

  // Validate test name when collection is selected or name changes
  useEffect(() => {
    const validateName = async () => {
      if (name && selectedCollectionId) {
        try {
          const isDuplicate = await onValidateTestName(name, selectedCollectionId);
          setNameError(isDuplicate ? 'API test name is already exist' : null);
        } catch (error) {
          console.error('Error validating test name:', error);
        }
      } else {
        setNameError(null);
      }
    };

    validateName();
  }, [name, selectedCollectionId, onValidateTestName]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your test",
        variant: "destructive"
      });
      return;
    }

    if (nameError) {
      toast({
        title: "Invalid test name",
        description: nameError,
        variant: "destructive"
      });
      return;
    }

    try {
      let collectionId = selectedCollectionId;
      
      // If creating new collection
      if (showCreateCollection && newCollectionName.trim()) {
        // Validate collection name
        const duplicateCollection = collections.find(c => c.name.toLowerCase() === newCollectionName.toLowerCase());
        if (duplicateCollection) {
          toast({
            title: "Invalid collection name",
            description: "Collection name already exists",
            variant: "destructive"
          });
          return;
        }

        setIsCreatingCollection(true);
        try {
          const newCollectionId = await onCreateCollection(
            newCollectionName.trim(),
            newCollectionDescription.trim()
          );
          if (!newCollectionId) {
            throw new Error("Failed to create collection");
          }
          collectionId = newCollectionId;
        } catch (error) {
          throw new Error("Failed to create collection: " + (error instanceof Error ? error.message : 'Unknown error'));
        }
      }

      // Ensure we have a valid collection ID if creating new collection
      if (showCreateCollection && !collectionId) {
        throw new Error("Failed to get new collection ID");
      }

      // Save test to collection (new or selected)
      await onSave(
        name.trim(), 
        collectionId,
        currentRequest.method,
        currentRequest.url,
        currentRequest.headers,
        currentRequest.body
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving test:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save test",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCollection(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save API Test</DialogTitle>
          <DialogDescription>
            Give your API test a name and choose a collection to save it to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="test-name" className="text-sm font-medium mb-1 block">
              Test Name
            </Label>
            <Input
              id="test-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your test"
              autoFocus
            />
            {nameError && (
              <p className="text-sm text-red-500 mt-1">{nameError}</p>
            )}
          </div>

          {!showCreateCollection ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="collection-select">Add to Collection</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowCreateCollection(true)}
                >
                  Create New Collection
                </Button>
              </div>
              <Select 
                value={selectedCollectionId || 'none'} 
                onValueChange={(value) => setSelectedCollectionId(value === 'none' ? null : value)}
              >
                <SelectTrigger id="collection-select">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No collection</SelectItem>
                  {collections.map(collection => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Create New Collection</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={() => setShowCreateCollection(false)}
                >
                  Cancel
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-name">Collection Name</Label>
                <Input
                  id="collection-name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-description">Description</Label>
                <Textarea
                  id="collection-description"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Enter collection description"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || isCreatingCollection || !name.trim() || nameError !== null || 
              (showCreateCollection && !newCollectionName.trim())}
          >
            {saving || isCreatingCollection ? 'Saving...' : 'Save Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTestDialog;
