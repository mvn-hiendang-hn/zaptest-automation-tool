
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { checkNameUniqueness } from '@/integrations/supabase/client';
import type { CollectionFormProps } from '@/types';

const CollectionForm: React.FC<CollectionFormProps> = ({
  onSave,
  onCancel,
  collection,
  saving
}) => {
  // Parse name if it's a JSON string, ensure it's not null
  let initialName = '';
  if (collection && collection.name !== null && collection.name !== undefined) {
    initialName = typeof collection.name === 'object' 
      ? (collection.name !== null ? collection.name.toString() : '') 
      : collection.name;
  }

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(collection?.description || '');
  const [nameError, setNameError] = useState<string | null>(null);

  const validateName = async (collectionName: string) => {
    if (!collectionName.trim()) {
      setNameError("Collection name is required");
      return false;
    }
    
    try {
      const isUnique = await checkNameUniqueness(
        'api_collections', 
        collectionName,
        collection?.id
      );
      
      if (!isUnique) {
        setNameError(`A collection with the name "${collectionName}" already exists`);
        return false;
      }
      
      setNameError(null);
      return true;
    } catch (error) {
      console.error("Name validation error:", error);
      setNameError("Error validating name");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate for duplicate name
    const isNameValid = await validateName(name);
    if (!isNameValid) return;

    await onSave(name.trim(), description.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{collection ? 'Edit Collection' : 'Create Collection'}</CardTitle>
        <CardDescription>
          Group your API tests into collections for better organization
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="My API Collection"
              required
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <p className="text-sm text-red-500 mt-1">{nameError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this collection is for..."
              className="resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : (collection ? 'Update' : 'Create')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CollectionForm;
