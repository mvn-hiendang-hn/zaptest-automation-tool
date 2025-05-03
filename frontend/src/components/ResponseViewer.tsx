import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';

interface ResponseViewerProps {
  responseStatus: number | null;
  responseData: any;
  onSaveClick?: () => void;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ 
  responseStatus, 
  responseData,
  onSaveClick 
}) => {
  const getStatusColorClass = (status: number | null) => {
    if (!status) return 'bg-gray-500';
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-yellow-500';
    if (status >= 400 && status < 500) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatJSON = (data: any) => {
    try {
      if (typeof data === 'string') {
        // Try to parse if it's a JSON string
        try {
          data = JSON.parse(data);
        } catch {
          // If it's not valid JSON, keep as string
        }
      }
      
      // Format the data
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Response</CardTitle>
          {responseStatus && (
            <Badge className={getStatusColorClass(responseStatus)}>
              {responseStatus}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {responseData ? (
          <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-md h-full overflow-auto">
            {formatJSON(responseData)}
          </pre>
        ) : (
          <div className="text-muted-foreground text-center py-6">
            No response data available
          </div>
        )}
      </CardContent>
      {onSaveClick && (
        <CardFooter className="pt-2">
          <Button 
            variant="outline" 
            className="w-full"
            disabled={!responseStatus || !responseData}
            onClick={onSaveClick}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Test
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ResponseViewer;
