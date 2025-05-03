import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { getScheduleDescription, calculateNextRunTime } from '@/utils/scheduleUtils';
import ScheduleForm from '@/components/ScheduleForm';
import SchedulesList from '@/components/SchedulesList';
import { useNavigate } from 'react-router-dom';
import type { Schedule, ScheduleConfig, APICollection } from '@/types';
import { API_BASE_URL } from '@/config/api';

const Schedules = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [runningSchedule, setRunningSchedule] = useState<string | null>(null);
  const [collections, setCollections] = useState<APICollection[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadSchedules = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/schedules`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load schedules');
      }

      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: 'Error loading schedules',
        description: 'There was an error loading the schedules list.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/collections`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load collections');
      }

      const data = await response.json();
      setCollections(data.data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: 'Error loading collections',
        description: 'There was an error loading your collections.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSchedule = async (schedule: ScheduleConfig) => {
    try {
      setSaving(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const scheduleData = {
        name: schedule.name,
        collectionId: schedule.collectionId,
        frequency: schedule.frequency,
        selectedDays: schedule.selectedDays.map(day => parseInt(day, 10)),
        timerType: schedule.timerType,
        minuteInterval: schedule.minuteInterval,
        hourInterval: schedule.hourInterval,
        dayTime: schedule.dayTime,
        weekDay: schedule.weekDay,
        weekTime: schedule.weekTime,
        sendEmailReport: schedule.sendEmailReport,
        recipientEmail: user?.email || ''
      };

      const response = await fetch(`${API_BASE_URL}/schedules${editingSchedule ? `/${editingSchedule.id}` : ''}`, {
        method: editingSchedule ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      toast({
        title: 'Schedule updated',
        description: 'The schedule has been updated successfully.',
      });

      setShowScheduleForm(false);
      setEditingSchedule(null);
      loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error updating schedule',
        description: 'There was an error updating the schedule.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, active: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/schedules/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: active ? 'active' : 'inactive' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule status');
      }

      toast({
        title: 'Success',
        description: 'The schedule status has been updated.',
      });

      loadSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast({
        title: 'Error updating schedule status',
        description: error instanceof Error ? error.message : 'The error occurred while updating the schedule status.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      toast({
        title: 'Schedule deleted',
        description: 'The schedule has been deleted successfully.',
      });

      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error deleting schedule',
        description: 'There was an error deleting the schedule.',
        variant: 'destructive',
      });
    }
  };

  const handleRunSchedule = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to run schedule');
      }

      toast({
        title: 'Schedule run started',
        description: 'The schedule is running in the background.',
      });

      loadSchedules();
    } catch (error) {
      console.error('Error running schedule:', error);
      toast({
        title: 'Error running schedule',
        description: error instanceof Error ? error.message : 'There was an error running the schedule.',
        variant: 'destructive',
      });
    }
  };
  
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadSchedules();
    loadCollections();
  }, [user?.id]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">API Schedules</h1>
        <Button onClick={() => {
          setEditingSchedule(null);
          setShowScheduleForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {showScheduleForm && (
        <div className="mb-6">
          <ScheduleForm
            onSave={handleSaveSchedule}
            onCancel={() => {
              setShowScheduleForm(false);
              setEditingSchedule(null);
            }}
            collections={collections}
            saving={saving}
            schedule={editingSchedule || undefined}
          />
        </div>
      )}

      <SchedulesList
        schedules={schedules}
        onEdit={handleEditSchedule}
        onDelete={handleDeleteSchedule}
        onRun={handleRunSchedule}
        onToggleActive={handleUpdateStatus}
        runningSchedule={runningSchedule}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default Schedules;
