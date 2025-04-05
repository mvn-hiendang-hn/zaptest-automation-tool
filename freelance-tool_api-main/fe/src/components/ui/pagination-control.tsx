import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange?: (pageSize: number) => void;
  totalItems?: number;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than or equal to max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end based on current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(start + maxPagesToShow - 3, totalPages - 1);
      
      // Adjust start if end is maxed out
      if (end === totalPages - 1) {
        start = Math.max(2, end - (maxPagesToShow - 3));
      }
      
      // Add ellipsis if needed before middle pages
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed after middle pages
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        {totalItems !== undefined && (
          <p>
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems || 0)} to{' '}
            {Math.min(currentPage * pageSize, totalItems || 0)} of {totalItems} items
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {onPageSizeChange && (
          <select
            className="h-8 w-16 rounded-md border border-input bg-background px-2"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        )}
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {getPageNumbers().map((page, i) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <Button
                  key={`${page}-${i}`}
                  variant="outline"
                  disabled
                  className="h-8 w-8"
                >
                  ...
                </Button>
              );
            }
            
            return (
              <Button
                key={`page-${page}-${i}`}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8"
              >
                {page}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControl;
