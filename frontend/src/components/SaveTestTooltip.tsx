import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SaveTestTooltipProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, collectionId: string | null) => Promise<void>;
  saving: boolean;
  collections: { id: string; name: string }[];
  onCreateCollection: (name: string) => Promise<string | null>;
}

const SaveTestTooltip: React.FC<SaveTestTooltipProps> = ({
  open,
  onOpenChange,
  onSave,
  saving,
  collections,
  onCreateCollection
}) => {
  const [name, setName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, isCreatingCollection]);

  useEffect(() => {
    if (!open) {
      // Reset form when popover closes
      setName('');
      setSelectedCollectionId(null);
      setIsCreatingCollection(false);
      setNewCollectionName('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your test",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isCreatingCollection && newCollectionName.trim()) {
        setIsCreating(true);
        const newCollectionId = await onCreateCollection(newCollectionName.trim());
        if (newCollectionId) {
          await onSave(name.trim(), newCollectionId);
        }
      } else {
        await onSave(name.trim(), selectedCollectionId);
      }
      // Close the popover after successful save
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving test:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent className="w-80" side="top" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Save API Test</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-name">Test Name</Label>
            <Input
              id="test-name"
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter test name"
            />
          </div>
          
          {isCreatingCollection ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-collection">New Collection</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={() => setIsCreatingCollection(false)}
                >
                  Cancel
                </Button>
              </div>
              <Input
                id="new-collection"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="collection-select">Add to Collection</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsCreatingCollection(true)}
                >
                  Create New
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
          )}
          
          <div className="flex justify-end pt-2">
            <Button 
              disabled={saving || isCreating || (!name.trim()) || (isCreatingCollection && !newCollectionName.trim())} 
              onClick={handleSave}
            >
              {saving || isCreating ? 'Saving...' : 'Save Test'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SaveTestTooltip;
