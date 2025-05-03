// Get all schedules for a user
exports.getSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const schedules = await req.prisma.schedule.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalCount = await req.prisma.schedule.count({
      where: { userId: req.user.id },
    });

    // Calculate next run and transform sendEmail to sendEmailReport
    const schedulesWithNextRun = schedules.map(schedule => {
      const { calculateNextRun } = require('../services/scheduleService');
      const nextRun = calculateNextRun(schedule);
      
      const { sendEmail, ...rest } = schedule;
      return {
        ...rest,
        sendEmailReport: sendEmail,
        nextRun,
      };
    });

    res.json({
      data: schedulesWithNextRun,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Error fetching schedules' });
  }
};

// Get a single schedule by ID
exports.getSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await req.prisma.schedule.findUnique({
      where: { id },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user owns the schedule
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Calculate next run and transform sendEmail to sendEmailReport
    const { calculateNextRun } = require('../services/scheduleService');
    const nextRun = calculateNextRun(schedule);
    
    const { sendEmail, ...rest } = schedule;
    res.json({
      ...rest,
      sendEmailReport: sendEmail,
      nextRun,
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Error fetching schedule' });
  }
};

// Create a new schedule
exports.createSchedule = async (req, res) => {
  try {
    const {
      name,
      collectionId,
      frequency,
      selectedDays,
      timerType,
      minuteInterval,
      hourInterval,
      dayTime,
      weekDay,
      weekTime,
      sendEmail,
      sendEmailReport,
      recipientEmail,
    } = req.body;

    if (!name || !collectionId || !timerType) {
      return res.status(400).json({ message: 'Name, collection ID, and timer type are required' });
    }

    // Check if collection exists
    const collection = await req.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Check if user owns the collection
    if (collection.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to use this collection' });
    }

    // Check if schedule with same name exists
    const existingSchedule = await req.prisma.schedule.findFirst({
      where: {
        name,
        userId: req.user.id,
      },
    });

    if (existingSchedule) {
      return res.status(400).json({ message: 'Schedule with this name already exists' });
    }

    // Validate schedule parameters based on timer type
    if (timerType === 'minute' && !minuteInterval) {
      return res.status(400).json({ message: 'Minute interval is required for minute timer' });
    }

    if (timerType === 'hour' && !hourInterval) {
      return res.status(400).json({ message: 'Hour interval is required for hour timer' });
    }

    if (timerType === 'day' && !dayTime) {
      return res.status(400).json({ message: 'Day time is required for day timer' });
    }

    if (timerType === 'week' && (!weekDay || !weekTime)) {
      return res.status(400).json({ message: 'Week day and time are required for week timer' });
    }

    // Generate cron expression based on timer type
    let cronExpression = '';
    switch (timerType) {
      case 'minute':
        cronExpression = `*/${minuteInterval} * * * *`;
        break;
      case 'hour':
        cronExpression = `0 */${hourInterval} * * *`;
        break;
      case 'day':
        const [dayHours, dayMinutes] = dayTime.split(':');
        cronExpression = `${dayMinutes} ${dayHours} * * *`;
        break;
      case 'week':
        const [weekHours, weekMinutes] = weekTime.split(':');
        const weekDayMap = {
          'sunday': 0,
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
          'weekday': '1-5'
        };
        const weekDayNum = weekDayMap[weekDay];
        cronExpression = `${weekMinutes} ${weekHours} * * ${weekDayNum}`;
        break;
    }

    const schedule = await req.prisma.schedule.create({
      data: {
        name,
        frequency: frequency || 'daily',
        selectedDays: selectedDays || [],
        timerType,
        minuteInterval,
        hourInterval,
        dayTime,
        weekDay,
        weekTime,
        sendEmail: sendEmailReport !== undefined ? sendEmailReport : (sendEmail || false),
        recipientEmail: (sendEmailReport !== undefined ? sendEmailReport : (sendEmail || false)) ? recipientEmail : null,
        active: true,
        cronExpression,
        userId: req.user.id,
        collectionId,
      },
    });

    // Calculate next run
    const { calculateNextRun } = require('../services/scheduleService');
    const nextRun = calculateNextRun(schedule);

    res.status(201).json({
      ...schedule,
      nextRun,
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Error creating schedule' });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      collectionId,
      frequency,
      selectedDays,
      timerType,
      minuteInterval,
      hourInterval,
      dayTime,
      weekDay,
      weekTime,
      sendEmail,
      sendEmailReport,
      recipientEmail,
    } = req.body;

    // Check if schedule exists
    const schedule = await req.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user owns the schedule
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // If changing collection, verify it exists and user owns it
    if (collectionId && collectionId !== schedule.collectionId) {
      const collection = await req.prisma.collection.findUnique({
        where: { id: collectionId },
      });

      if (!collection) {
        return res.status(404).json({ message: 'Collection not found' });
      }

      if (collection.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to use this collection' });
      }
    }

    // If changing name, check if it already exists
    if (name && name !== schedule.name) {
      const existingSchedule = await req.prisma.schedule.findFirst({
        where: {
          name,
          userId: req.user.id,
          id: { not: id },
        },
      });

      if (existingSchedule) {
        return res.status(400).json({ message: 'Schedule with this name already exists' });
      }
    }

    // Update the schedule with provided fields
    const updatedSchedule = await req.prisma.schedule.update({
      where: { id },
      data: {
        name: name || undefined,
        collectionId: collectionId || undefined,
        frequency: frequency || undefined,
        selectedDays: selectedDays !== undefined ? selectedDays : undefined,
        timerType: timerType || undefined,
        minuteInterval: minuteInterval !== undefined ? minuteInterval : undefined,
        hourInterval: hourInterval !== undefined ? hourInterval : undefined,
        dayTime: dayTime !== undefined ? dayTime : undefined,
        weekDay: weekDay !== undefined ? weekDay : undefined,
        weekTime: weekTime !== undefined ? weekTime : undefined,
        sendEmail: sendEmailReport !== undefined ? sendEmailReport : (sendEmail !== undefined ? sendEmail : undefined),
        recipientEmail: recipientEmail !== undefined ? recipientEmail : undefined,
        updatedAt: new Date(),
      },
    });

    // Calculate next run
    const { calculateNextRun } = require('../services/scheduleService');
    const nextRun = calculateNextRun(updatedSchedule);

    res.json({
      ...updatedSchedule,
      nextRun,
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ message: 'Error updating schedule' });
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const schedule = await req.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user owns the schedule
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await req.prisma.schedule.delete({
      where: { id },
    });

    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Error deleting schedule' });
  }
};

// Toggle schedule active status
exports.toggleScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'Active status is required' });
    }

    // Check if schedule exists
    const schedule = await req.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user owns the schedule
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedSchedule = await req.prisma.schedule.update({
      where: { id },
      data: {
        active,
        updatedAt: new Date(),
      },
    });

    // Calculate next run
    const { calculateNextRun } = require('../services/scheduleService');
    const nextRun = calculateNextRun(updatedSchedule);

    res.json({
      ...updatedSchedule,
      nextRun,
    });
  } catch (error) {
    console.error('Toggle schedule status error:', error);
    res.status(500).json({ message: 'Error updating schedule status' });
  }
};

// Run a schedule manually
exports.runSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduleService } = require('../services/scheduleService');

    // Check if schedule exists
    const schedule = await req.prisma.schedule.findUnique({
      where: { id },
      include: {
        collection: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user owns the schedule
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Run the schedule
    const result = await scheduleService.executeSchedule(req.prisma, schedule);

    res.json(result);
  } catch (error) {
    console.error('Run schedule error:', error);
    res.status(500).json({ message: 'Error running schedule' });
  }
};
