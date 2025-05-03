import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ScheduleConfig, ScheduleFormProps } from '@/types';
import { API_BASE_URL } from '@/config/api';

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  onSave,
  onCancel,
  collections,
  schedule,
  saving,
  defaultCollectionId
}) => {
  const [name, setName] = useState(schedule?.name || '');
  const [collectionId, setCollectionId] = useState(
    defaultCollectionId || schedule?.collectionId || (collections[0]?.id || '')
  );
  const [timerType, setTimerType] = useState<"minute" | "hour" | "day" | "week">(
    (schedule?.timerType as "minute" | "hour" | "day" | "week") || "week"
  );
  const [minuteInterval, setMinuteInterval] = useState<5 | 15 | 30>(
    (schedule?.minuteInterval as 5 | 15 | 30) || 30
  );
  const [hourInterval, setHourInterval] = useState<1 | 2 | 4 | 6 | 12>(
    (schedule?.hourInterval as 1 | 2 | 4 | 6 | 12) || 1
  );
  const [weekDay, setWeekDay] = useState<"weekday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday">(
    (schedule?.weekDay as "weekday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday") || "weekday"
  );
  const [weekTime, setWeekTime] = useState<string>(
    schedule?.weekTime || '17:00'
  );
  const [dayTime, setDayTime] = useState<string>(
    schedule?.dayTime || '09:00'
  );
  const [sendEmailReport, setSendEmailReport] = useState(
    schedule?.sendEmailReport !== undefined ? schedule.sendEmailReport : true
  );
  const [nameError, setNameError] = useState<string | null>(null);

  // Update collectionId if collections change
  useEffect(() => {
    if (!schedule && collections.length > 0 && !collectionId) {
      setCollectionId(collections[0].id);
    }
  }, [collections, schedule, collectionId]);

  // Validate name for duplicates
  const validateName = async (scheduleName: string) => {
    if (!scheduleName.trim()) {
      setNameError("Schedule name is required");
      return false;
    }
    
    // If we're editing and the name hasn't changed, no need to check for duplicates
    if (schedule?.name === scheduleName.trim()) {
      setNameError(null);
      return true;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNameError("Please log in");
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/schedules/check-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: scheduleName,
          id: schedule?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Error checking name');
      }

      const data = await response.json();
      
      if (!data.isUnique) {
        setNameError(`A schedule with the name "${scheduleName}" already exists`);
        return false;
      }
      
      setNameError(null);
      return true;
    } catch (error) {
      console.error("Error checking name:", error);
      setNameError("Error checking name");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !collectionId) return;
    
    // Validate for duplicate name
    const isNameValid = await validateName(name);
    if (!isNameValid) return;
    
    const scheduleConfig: ScheduleConfig = {
      name,
      collectionId,
      frequency: 'daily', // Default value since we're using timerType now
      selectedDays: [], // Default empty array since we're using weekDay now
      timerType,
      sendEmailReport
    };

    // Add the id if we're editing an existing schedule
    if (schedule?.id) {
      scheduleConfig.id = schedule.id;
    }

    // Add the appropriate interval property based on timer type
    if (timerType === 'minute') {
      scheduleConfig.minuteInterval = minuteInterval;
    } else if (timerType === 'hour') {
      scheduleConfig.hourInterval = hourInterval;
    } else if (timerType === 'day') {
      scheduleConfig.dayTime = dayTime;
    } else if (timerType === 'week') {
      scheduleConfig.weekDay = weekDay;
      scheduleConfig.weekTime = weekTime;
    }
    
    await onSave(scheduleConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{schedule ? 'Edit Schedule' : 'Create Schedule'}</CardTitle>
        <CardDescription>
          Schedule automatic runs for API collection tests
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Schedule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="Daily health check"
              required
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <p className="text-sm text-red-500 mt-1">{nameError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="collection">Collection</Label>
            <Select 
              value={collectionId} 
              onValueChange={(value) => setCollectionId(value)}
              required
            >
              <SelectTrigger id="collection">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections
                  .filter(collection => collection.testCount > 0)
                  .map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Timer Type</Label>
            <Select 
              value={timerType} 
              onValueChange={(value: "minute" | "hour" | "day" | "week") => setTimerType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minute">Minute timer</SelectItem>
                <SelectItem value="hour">Hour timer</SelectItem>
                <SelectItem value="day">Daily timer</SelectItem>
                <SelectItem value="week">Weekly timer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {timerType === 'minute' && (
            <div className="space-y-2">
              <Label>Minute Interval</Label>
              <Select 
                value={minuteInterval.toString()} 
                onValueChange={(value) => setMinuteInterval(parseInt(value) as 5 | 15 | 30)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {timerType === 'hour' && (
            <div className="space-y-2">
              <Label>Hour Interval</Label>
              <Select 
                value={hourInterval.toString()} 
                onValueChange={(value) => setHourInterval(parseInt(value) as 1 | 2 | 4 | 6 | 12)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every hour</SelectItem>
                  <SelectItem value="2">Every 2 hours</SelectItem>
                  <SelectItem value="4">Every 4 hours</SelectItem>
                  <SelectItem value="6">Every 6 hours</SelectItem>
                  <SelectItem value="12">Every 12 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {timerType === 'day' && (
            <div className="space-y-2">
              <Label>Time of Day</Label>
              <Input
                type="time"
                value={dayTime}
                onChange={(e) => setDayTime(e.target.value)}
              />
            </div>
          )}
          
          {timerType === 'week' && (
            <>
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select 
                  value={weekDay} 
                  onValueChange={(value: "weekday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday") => setWeekDay(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">Weekdays only</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Input
                  type="time"
                  value={weekTime}
                  onChange={(e) => setWeekTime(e.target.value)}
                />
              </div>
            </>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmailReport}
              onCheckedChange={(checked) => setSendEmailReport(checked as boolean)}
            />
            <Label htmlFor="sendEmail">Send email report after each run</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : (schedule ? 'Update' : 'Create')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ScheduleForm;
