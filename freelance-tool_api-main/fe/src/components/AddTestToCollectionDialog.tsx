
import React, { useState, useEffect } from 'react';
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
import { checkNameUniqueness } from '@/integrations/supabase/client';
import type { ApiTestData } from '@/types';

interface AddTestToCollectionDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  onSave: (test: ApiTestData) => Promise<void>;
  saving: boolean;
  test?: ApiTestData;
}

const AddTestToCollectionDialog: React.FC<AddTestToCollectionDialogProps> = ({
  open,
  onClose,
  onSave,
  saving,
  test
}) => {
  const [name, setName] = useState(test?.name || '');
  const [method, setMethod] = useState<string>(test?.method || 'GET');
  const [url, setUrl] = useState(test?.url || '');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (test) {
      setName(test.name || '');
      setMethod(test.method || 'GET');
      setUrl(test.url || '');
      setHeaders(test.headers ? JSON.stringify(test.headers, null, 2) : '');
      setBody(test.body ? JSON.stringify(test.body, null, 2) : '');
    } else {
      // Reset form when dialog opens without a test
      setName('');
      setMethod('GET');
      setUrl('');
      setHeaders('');
      setBody('');
    }
  }, [test, open]);

  const validateName = async (testName: string) => {
    if (!testName.trim()) {
      setNameError("Test name is required");
      return false;
    }
    
    try {
      const isUnique = await checkNameUniqueness(
        'api_tests', 
        testName,
        test?.id
      );
      
      if (!isUnique) {
        setNameError(`A test with the name "${testName}" already exists`);
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
    if (!name.trim() || !url.trim()) return;

    // Validate for duplicate name
    const isNameValid = await validateName(name);
    if (!isNameValid) return;

    let parsedHeaders = {};
    if (headers.trim()) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (error) {
        console.error('Invalid headers JSON:', error);
        return;
      }
    }

    let parsedBody = body.trim() ? body : "";
    try {
      if (body.trim()) {
        JSON.parse(body); // Just to validate JSON
      }
    } catch (error) {
      console.error('Invalid body JSON:', error);
      return;
    }

    await onSave({
      id: test?.id,
      name: name.trim(),
      method,
      url: url.trim(),
      headers: parsedHeaders,
      body: parsedBody
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{test ? 'Edit API Test' : 'Add API Test'}</DialogTitle>
          <DialogDescription>
            Configure your API test details and parameters
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Test Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Login API Test"
                required
                className={nameError ? "border-red-500" : ""}
              />
              {nameError && (
                <p className="text-sm text-red-500 mt-1">{nameError}</p>
              )}
            </div>
          
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          
              <div className="col-span-3 space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                className="font-mono text-sm"
              />
            </div>
          
            <div className="space-y-2">
              <Label htmlFor="body">Body (JSON)</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (test ? 'Update' : 'Add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTestToCollectionDialog;
