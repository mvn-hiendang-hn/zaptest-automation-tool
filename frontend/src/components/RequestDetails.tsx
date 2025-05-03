
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';
import { SavedTest } from '@/types';

interface RequestDetailsProps {
  test: SavedTest;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ test }) => {
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-blue-500';
    if (status >= 400 && status < 500) return 'bg-yellow-500';
    if (status >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers).map(([key, value]) => (
      <div key={key} className="text-sm mb-1">
        <span className="font-semibold">{key}:</span> {value}
      </div>
    ));
  };

  const formatBody = (body: string) => {
    if (!body) return <span className="text-gray-500 italic">No body</span>;

    try {
      const parsed = JSON.parse(body);
      return (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      return <pre className="text-xs">{body}</pre>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{test.name}</CardTitle>
          <Badge
            className={`${getStatusColor(test.responseStatus)} text-white`}
          >
            {test.responseStatus}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDistance(test.timestamp, new Date(), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div>
          <Label className="font-semibold block mb-1">Method & URL</Label>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              {test.request.method}
            </Badge>
            <span className="text-sm truncate">{test.request.url}</span>
          </div>
        </div>

        {Object.keys(test.request.headers).length > 0 && (
          <div>
            <Label className="font-semibold block mb-1">Headers</Label>
            <div className="bg-gray-50 p-2 rounded">
              {formatHeaders(test.request.headers)}
            </div>
          </div>
        )}

        {test.request.body && (
          <div>
            <Label className="font-semibold block mb-1">Request Body</Label>
            <div className="bg-gray-50 p-2 rounded">
              {formatBody(test.request.body)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestDetails;
