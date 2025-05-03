import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, Play, Trash2 } from 'lucide-react';
import PaginationControl from '@/components/ui/pagination-control';

export interface APICollection {
  id: string;
  name: string;
  description?: string | null;
  createdAt: number;
  testCount: number;
}

interface CollectionsListProps {
  collections: APICollection[];
  isLoading: boolean;
  onSelectCollection: (id: string) => void;
  onDeleteCollection: (id: string) => Promise<void>;
  onRunCollection: (id: string) => Promise<void>;
  onScheduleCollection: (id: string) => void;
  selectedCollectionId?: string;
  runningCollectionId?: string;
  // Pagination props
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const CollectionsList: React.FC<CollectionsListProps> = ({
  collections,
  isLoading,
  onSelectCollection,
  onDeleteCollection,
  onRunCollection,
  onScheduleCollection,
  selectedCollectionId,
  runningCollectionId,
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

  if (collections.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No collections created yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Table>
        <TableCaption>A list of your API test collections.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Tests</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => (
            <TableRow key={collection.id} className={selectedCollectionId === collection.id ? "bg-muted" : ""}>
              <TableCell>
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal" 
                  onClick={() => onSelectCollection(collection.id)}
                >
                  {collection.name}
                </Button>
              </TableCell>
              <TableCell>{collection.description || "—"}</TableCell>
              <TableCell>{collection.testCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onRunCollection(collection.id)}
                    title="Run collection"
                    disabled={runningCollectionId === collection.id || collection.testCount === 0}
                  >
                    {runningCollectionId === collection.id ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onScheduleCollection(collection.id)}
                    title="Schedule collection"
                    disabled={collection.testCount === 0}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDeleteCollection(collection.id)}
                    title="Delete collection"
                  >
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

export default CollectionsList;
