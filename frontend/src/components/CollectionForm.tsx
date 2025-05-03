import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from '@/config/api';
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface CollectionFormProps {
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
  collection?: {
    id: string;
    name: string;
    description: string | null;
  };
  saving?: boolean;
}

const CollectionForm: React.FC<CollectionFormProps> = ({ onSave, onCancel, collection, saving }) => {
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateName = async (name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/collections/check-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name,
          id: collection?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to validate name');
      }

      const data = await response.json();
      if (!data.isUnique) {
        setNameError(`A collection with the name "${name}" already exists`);
        return false;
      }
      setNameError(null);
      return true;
    } catch (error) {
      console.error('Error validating name:', error);
      setNameError('Error checking name');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateName(name);
    if (!isValid) return;
    
    await onSave(name, description);
  };

  return (
    <div>
      <CardHeader>
        <CardTitle>{collection ? 'Edit Collection' : 'Create New Collection'}</CardTitle>
        <CardDescription>
          {collection 
            ? 'Update your API collection details'
            : 'Create a new collection to organize your API tests'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="Enter collection name"
                className={nameError ? "border-red-500" : ""}
                required
              />
              {nameError && (
                <p className="text-sm text-red-500">{nameError}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter collection description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : (collection ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </div>
  );
};

export default CollectionForm;
