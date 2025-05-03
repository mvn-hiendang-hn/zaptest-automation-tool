import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RequestFormProps {
  onSendRequest: (request: RequestConfig) => void;
  loading: boolean;
}

export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

const RequestForm: React.FC<RequestFormProps> = ({ onSendRequest, loading }) => {
  const { toast } = useToast();
  const [request, setRequest] = useState<RequestConfig>({
    method: 'GET',
    url: '',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  });

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequest(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleHeaderChange = (key: string, value: string) => {
    setRequest(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        [key]: value,
      },
    }));
  };

  const addHeader = () => {
    setRequest(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        '': '',
      },
    }));
  };

  const removeHeader = (key: string) => {
    const newHeaders = {...request.headers};
    delete newHeaders[key];
    setRequest(prev => ({
      ...prev,
      headers: newHeaders,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra URL hợp lệ
    try {
      new URL(request.url);
      onSendRequest(request);
    } catch (error) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL (e.g. https://api.example.com)',
        variant: 'destructive',
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        setRequest(prev => ({
          ...prev,
          body: JSON.stringify(json, null, 2),
        }));
        toast({
          title: 'JSON loaded',
          description: 'JSON data has been loaded into the request body.',
        });
      } catch (error: any) {
        console.error('Error parsing JSON:', error);
        toast({
          title: 'Error parsing JSON',
          description: 'There was an error parsing the JSON file.',
          variant: 'destructive',
        });
      }
    };

    reader.readAsText(file);
  }, [toast]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'application/json': ['.json'] } });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request</CardTitle>
        <CardDescription>Define your API request.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="method">Method</Label>
            <Select value={request.method} onValueChange={(value) => setRequest(prev => ({ ...prev, method: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              name="url"
              placeholder="https://api.example.com/resource"
              value={request.url}
              onChange={handleRequestChange}
              required
            />
          </div>
          <div>
            <Label>Headers</Label>
            <div className="space-y-2">
              {Object.entries(request.headers).map(([key, value]) => (
                <div key={key} className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Header Name"
                    value={key}
                    onChange={(e) => handleHeaderChange(e.target.value, value)}
                    onBlur={(e) => {
                      const newKey = e.target.value;
                      if (newKey !== key) {
                        const newValue = request.headers[key];
                        removeHeader(key);
                        handleHeaderChange(newKey, newValue);
                      }
                    }}
                  />
                  <Input
                    type="text"
                    placeholder="Header Value"
                    value={value}
                    onChange={(e) => handleHeaderChange(key, e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeHeader(key)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Request body (JSON)"
              value={request.body}
              onChange={handleRequestChange}
            />
            <div {...getRootProps()} className="mt-2 border-dashed border-2 rounded-md p-4 text-center cursor-pointer bg-muted hover:bg-accent">
              <input {...getInputProps()} />
              <p className="text-sm text-muted-foreground">
                Drag 'n' drop a JSON file here, or click to select a file
              </p>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </div>
            ) : (
              'Send Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestForm;
