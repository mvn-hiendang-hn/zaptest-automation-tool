const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lưu trữ các cron job đang chạy
const activeJobs = new Map();

// Khởi tạo lại tất cả các cron job khi server khởi động
const initializeCronJobs = async () => {
  try {
    // Lấy tất cả các schedule đang active
    const activeSchedules = await prisma.schedule.findMany({
      where: { active: true }
    });

    // Tạo cron job cho mỗi schedule
    for (const schedule of activeSchedules) {
      createCronJob(schedule);
    }

    console.log('Đã khởi tạo lại tất cả các cron job');
  } catch (error) {
    console.error('Lỗi khởi tạo cron jobs:', error);
  }
};

// Tạo một cron job mới
const createCronJob = (schedule) => {
  try {
    // Hủy job cũ nếu có
    if (activeJobs.has(schedule.id)) {
      activeJobs.get(schedule.id).stop();
      activeJobs.delete(schedule.id);
    }

    // Tạo job mới
    const job = cron.schedule(schedule.cronExpression, async () => {
      try {
        // Kiểm tra schedule có còn active không
        const activeSchedule = await prisma.schedule.findUnique({
          where: { id: schedule.id }
        });

        if (activeSchedule && activeSchedule.active) {
          // Chạy schedule
          await runSchedule(schedule);
        } else {
          // Nếu schedule không còn active, dừng job
          job.stop();
          activeJobs.delete(schedule.id);
        }
      } catch (error) {
        console.error('Lỗi chạy scheduled task:', error);
      }
    });

    // Lưu job vào Map
    activeJobs.set(schedule.id, job);
    console.log(`Đã tạo cron job cho schedule ${schedule.id}`);
  } catch (error) {
    console.error('Lỗi tạo cron job:', error);
  }
};

// Chạy một schedule
const runSchedule = async (schedule) => {
  try {
    // Lấy collection và tests
    const collection = await prisma.collection.findUnique({
      where: { id: schedule.collectionId },
      include: { tests: true }
    });

    if (!collection) {
      throw new Error('Không tìm thấy collection');
    }

    // Tạo collection run mới
    const collectionRun = await prisma.collectionRun.create({
      data: {
        status: 'running',
        totalTests: collection.tests.length,
        userId: schedule.userId,
        collectionId: schedule.collectionId,
        scheduleId: schedule.id
      }
    });

    // Chạy từng test trong collection
    const testResults = [];
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    for (const test of collection.tests) {
      try {
        const startTime = Date.now();
        
        // Gọi API
        const response = await fetch(test.url, {
          method: test.method,
          headers: test.headers || {},
          body: test.body || undefined
        });

        const duration = Date.now() - startTime;
        totalDuration += duration;

        // Lưu kết quả
        const testResult = await prisma.testResult.create({
          data: {
            statusCode: response.status,
            duration,
            response: await response.json(),
            testId: test.id,
            collectionRunId: collectionRun.id
          }
        });

        testResults.push(testResult);
        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
        await prisma.testResult.create({
          data: {
            statusCode: 0,
            duration: 0,
            error: error.message,
            testId: test.id,
            collectionRunId: collectionRun.id
          }
        });
      }
    }

    // Cập nhật collection run
    await prisma.collectionRun.update({
      where: { id: collectionRun.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        successCount,
        failureCount,
        totalDuration
      }
    });

    // Cập nhật lastRun của schedule
    await prisma.schedule.update({
      where: { id: schedule.id },
      data: { lastRun: new Date() }
    });

    console.log(`Đã chạy xong schedule ${schedule.id}`);
  } catch (error) {
    console.error('Lỗi chạy schedule:', error);
  }
};

// Dừng một cron job
const stopCronJob = (scheduleId) => {
  if (activeJobs.has(scheduleId)) {
    activeJobs.get(scheduleId).stop();
    activeJobs.delete(scheduleId);
    console.log(`Đã dừng cron job cho schedule ${scheduleId}`);
  }
};

// Dừng tất cả các cron job
const stopAllCronJobs = () => {
  for (const [scheduleId, job] of activeJobs) {
    job.stop();
    console.log(`Đã dừng cron job cho schedule ${scheduleId}`);
  }
  activeJobs.clear();
};

module.exports = {
  initializeCronJobs,
  createCronJob,
  stopCronJob,
  stopAllCronJobs
}; 