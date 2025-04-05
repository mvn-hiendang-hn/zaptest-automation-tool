import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, Play, Trash2, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getScheduleDescription, formatNextRunTime } from '@/utils/scheduleUtils';
import PaginationControl from '@/components/ui/pagination-control';
import type { Schedule } from '@/types';

interface SchedulesListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onRun: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  runningSchedule: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const SchedulesList: React.FC<SchedulesListProps> = ({
  schedules,
  onEdit,
  onDelete,
  onRun,
  onToggleActive,
  runningSchedule,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange
}) => {
  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Schedules</h3>
            <p className="text-sm text-muted-foreground">
              You haven't created any API test schedules yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Table>
        <TableCaption>A list of your API test schedules.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Email Report</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{schedule.name}</TableCell>
              <TableCell>{schedule.collectionName}</TableCell>
              <TableCell>{getScheduleDescription(schedule)}</TableCell>
              <TableCell>
                <Badge variant={schedule.sendEmailReport ? "default" : "secondary"}>
                  {schedule.sendEmailReport ? "Enabled" : "Disabled"}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-pre-line">
                {schedule.active ? formatNextRunTime(schedule.nextRun) : 'Disabled'}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={schedule.active}
                    onCheckedChange={(checked) => onToggleActive(schedule.id, checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {schedule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(schedule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRun(schedule.id)}
                    disabled={!!runningSchedule}
                  >
                    {runningSchedule === schedule.id ? (
                      <Calendar className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="mt-6">
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
};

export default SchedulesList;
