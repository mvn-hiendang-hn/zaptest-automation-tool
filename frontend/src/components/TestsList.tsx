
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Trash2, Edit, Play } from 'lucide-react';
import PaginationControl from '@/components/ui/pagination-control';

export interface SavedTest {
  id: string;
  name: string;
  timestamp: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  responseStatus: number;
}

interface TestsListProps {
  savedTests: SavedTest[];
  isLoading: boolean;
  onRemoveTest: (id: string) => Promise<void>;
  onSelectTest?: (test: SavedTest) => void;
  selectedTestId?: string;
  onEditTest?: (test: SavedTest) => void;
  onRunTest?: (test: SavedTest) => void;
  // Pagination props
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const TestsList: React.FC<TestsListProps> = ({ 
  savedTests, 
  isLoading, 
  onRemoveTest, 
  onSelectTest,
  selectedTestId,
  onEditTest,
  onRunTest,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-md p-4">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (savedTests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No saved tests yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Table>
        <TableCaption>A list of your saved API tests.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {savedTests.map((test) => (
            <TableRow key={test.id} className={selectedTestId === test.id ? "bg-muted" : ""}>
              <TableCell>
                {onSelectTest ? (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal" 
                    onClick={() => onSelectTest(test)}
                  >
                    {test.name}
                  </Button>
                ) : (
                  test.name
                )}
              </TableCell>
              <TableCell>{test.request.method}</TableCell>
              <TableCell className="max-w-[250px] truncate">{test.request.url}</TableCell>
              <TableCell>{test.responseStatus}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  {onRunTest && (
                    <Button variant="ghost" size="sm" onClick={() => onRunTest(test)}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {onEditTest && (
                    <Button variant="ghost" size="sm" onClick={() => onEditTest(test)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onRemoveTest(test.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <PaginationControl
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export default TestsList;
