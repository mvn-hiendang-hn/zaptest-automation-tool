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
import { getSchedules } from '@/integrations/supabase/client';

const Schedules = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (user) {
      loadSchedules();
      loadCollections();
    }
  }, [user, currentPage, pageSize]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
  
      // Gọi API trực tiếp
      const response = await fetch(
        `http://localhost:5000/test-schedules?userId=${user.id}&page=${currentPage}&pageSize=${pageSize}`
      );
  
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
  
      const result = await response.json();
     
  
   
      const formattedSchedules: Schedule[] = result.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        collectionId: item.collection_id,
        collectionName: item.collection_name || "Unknown Collection",
        frequency: item.frequency,
        selectedDays: Array.isArray(item.selected_days)
          ? item.selected_days.map(String)
          : [],
        timerType: item.timer_type as "minute" | "hour" | "day" | "week",
        minuteInterval: item.minute_interval,
        hourInterval: item.hour_interval,
        dayTime: item.day_time,
        weekDay: item.week_day,
        weekTime: item.week_time,
        sendEmailReport: item.send_email,
        lastRun: item.last_run ? new Date(item.last_run).getTime() : null,
        active: item.active,
        nextRun: calculateNextRunTime({
          timerType: item.timer_type,
          minuteInterval: item.minute_interval,
          hourInterval: item.hour_interval,
          dayTime: item.day_time,
          weekDay: item.week_day,
          weekTime: item.week_time,
          lastRun: item.last_run ? new Date(item.last_run) : null,
          selectedDays: item.selected_days,
        }),
      }));
  
      // Cập nhật state
      setSchedules(formattedSchedules);
      setTotalItems(result.data.totalCount);
      setTotalPages(result.data.totalPages);
    } catch (error) {
      console.error("Error loading schedules:", error);
      toast({
        title: "Error loading schedules",
        description: "There was an error loading your schedules.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadCollections = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api-collections?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch collections");
  
      const { data } = await response.json(); // Giữ nguyên format trả về từ API
  
      const formattedCollections: APICollection[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || null,
        createdAt: new Date(item.created_at).getTime() || 0, // Chuyển về timestamp
        testCount: 0, // Hiện tại chưa có trường testCount, có thể cập nhật sau
      }));
  
      setCollections(formattedCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
      toast({
        title: "Error loading collections",
        description: "There was an error loading your collections.",
        variant: "destructive",
      });
    }
  };
  

  const handleSaveSchedule = async (schedule: ScheduleConfig) => {
    try {
      setSaving(true);
  
      // Chuẩn bị dữ liệu gửi lên server
      const scheduleData = {
        name: schedule.name,
        collection_id: schedule.collectionId || null,
        frequency: schedule.frequency,
        selected_days: JSON.stringify(schedule.selectedDays || []), // ⚠️ Lưu dưới dạng JSON
        timer_type: schedule.timerType,
        minute_interval: schedule.minuteInterval || 0, // ⚠️ Đảm bảo không thiếu
        hour_interval: schedule.hourInterval || null, // ⚠️ Kiểm tra nếu có
        day_time: schedule.dayTime || null, // ⚠️ Kiểm tra nếu có
        week_day: schedule.weekDay || null, // ⚠️ Kiểm tra nếu có
        week_time: schedule.weekTime || null, // ⚠️ Kiểm tra nếu có
        send_email: schedule.sendEmailReport || false,
        recipient_email: user.email || "",
        user_id: user.id,
      };
      // Kiểm tra nếu thiếu trường quan trọng
      if (!scheduleData.name || !scheduleData.frequency || !scheduleData.timer_type || 
          scheduleData.minute_interval === undefined || !scheduleData.user_id) {
        throw new Error("Missing required fields");
      }
  
      const response = await fetch("http://localhost:5000/test-schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });
  
      const responseData = await response.json();
      console.log("Server response:", responseData); // Debug response từ server
  
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create schedule");
      }
  
      toast({
        title: "Schedule created",
        description: "Your API test schedule has been created successfully.",
      });
  
      setShowScheduleForm(false);
      loadSchedules();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error creating schedule",
        description: error.message || "There was an error creating your schedule.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  

  const handleUpdateScheduleStatus = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/test-schedules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update schedule status");
      }
  
      const updatedSchedule = await response.json();
  
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === id ? { ...schedule, active: updatedSchedule.active } : schedule
        )
      );
  
      toast({
        title: active ? "Schedule activated" : "Schedule deactivated",
        description: `The schedule has been ${active ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating schedule status:", error);
      toast({
        title: "Error updating schedule",
        description: "There was an error updating the schedule status.",
        variant: "destructive",
      });
    }
  };
  

  const handleDeleteSchedule = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/test-schedules/${id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }
  
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
  
      toast({
        title: "Schedule deleted",
        description: "The schedule has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error deleting schedule",
        description: "There was an error deleting the schedule.",
        variant: "destructive",
      });
    }
  };
  
  const handleRunSchedule = async (id: string) => {
    try {
      setRunningSchedule(id);
  
      const response = await fetch(`http://localhost:5000/run-schedule/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to run schedule");
      }
  
      toast({
        title: "Schedule Running",
        description: "The schedule is now running. Results will be available soon.",
      });
  
      navigate("/history");
    } catch (error) {
      console.error("Error running schedule:", error);
      toast({
        title: "Error Running Schedule",
        description: "There was an error running the schedule.",
        variant: "destructive",
      });
    } finally {
      setRunningSchedule(null);
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
        onToggleActive={handleUpdateScheduleStatus}
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
