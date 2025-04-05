process.on("uncaughtException", (err, origin) => {
  console.log("Caught exception: ", err);
  console.log("Exception origin: ", origin);
});

const express = require("express");
const cors = require("cors");
const prisma = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const prismaClient = new prisma.PrismaClient();

app.use(cors());
app.use(express.json());

async function runTests(tests, runId) {
  return await Promise.all(
    tests.map(async (test) => {
      try {
        const startTime = Date.now();

        const headers = { "Content-Type": "application/json" };
        if (typeof test.headers === "object") {
          Object.entries(test.headers).forEach(([key, value]) => {
            headers[key] = String(value);
          });
        }

        const response = await fetch(test.url, {
          method: test.method,
          headers,
          body: test.body ? JSON.stringify(JSON.parse(test.body)) : undefined,
        });

        const duration = Date.now() - startTime;
        const responseText = await response.text();

        return {
          test_id: test.id,
          collection_run_id: runId,
          status_code: response.status,
          duration,
          error:
            response.status !== test.status_code
              ? "Status code mismatch"
              : null,
          response: responseText,
        };
      } catch (error) {
        return {
          test_id: test.id,
          collection_run_id: runId,
          status_code: 0,
          duration: 0,
          error: error.message,
          response: JSON.stringify({ error: error.message }),
        };
      }
    })
  );
}

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const user = await prismaClient.user.create({
      data: {
        username: email,
        password: hashedPassword,
        token,
      },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prismaClient.user.findUnique({
      where: { username: email },
    });
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      const userId = user.id;
      const userName = user.username;
      res.json({ token, userId, userName });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

app.post("/signout", async (req, res) => {
  res.json({ message: "Sign out successful" });
});

app.get("/check-name-unique", async (req, res) => {
  try {
    const { table, name, excludeId } = req.query;

    if (!table || !name) {
      return res.status(400).json({ error: "Table and name are required" });
    }

    // Determine which Prisma model to use based on table name
    let model;
    switch (table) {
      case "api_collections":
        model = prismaClient.api_collections;
        break;
      case "api_tests":
        model = prismaClient.api_tests;
        break;
      case "test_schedules":
        model = prismaClient.test_schedules;
        break;
      default:
        return res.status(400).json({ error: "Invalid table name" });
    }

    // Build query conditions
    const where = { name };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    // Check if name exists
    const found = await model.findFirst({ where });

    res.json({ isUnique: !found });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check name uniqueness" });
  }
});

// 📌 Tạo API Test
app.post("/api-tests", async (req, res) => {
  try {
    const {
      name,
      method,
      url,
      headers,
      body,
      response,
      status_code,
      user_id,
      collection_id,
    } = req.body;

    const data = await prismaClient.api_tests.create({
      data: {
        name,
        method,
        url,
        headers,
        body,
        response,
        status_code,
        user_id,
        collection_id,
      },
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create API test" });
  }
});

// xóa api test
app.delete("/api-tests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const apiTest = await prismaClient.api_tests.delete({
      where: { id }, // Không cần parseInt(id) vì id là kiểu String
    });

    res.json(apiTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete API test" });
  }
});
// 📌 Lấy API Tests theo userId
app.get("/api-tests", async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const pageNumber = parseInt(page, 10);
    const pageSizeNumber = parseInt(pageSize, 10);
    const skip = (pageNumber - 1) * pageSizeNumber;

    // Lấy tổng số lượng bản ghi
    const totalItems = await prismaClient.api_tests.count({
      where: { user_id: userId },
    });

    // Lấy dữ liệu có phân trang
    const apiTests = await prismaClient.api_tests.findMany({
      where: { user_id: userId },
      skip,
      take: pageSizeNumber,
    });

    res.json({
      data: apiTests,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSizeNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch API tests" });
  }
});

app.get("/api-tests/collectionId", async (req, res) => {
  try {
    const { collectionId, page = 1, pageSize = 10 } = req.query;

    if (!collectionId) {
      return res.status(400).json({ error: "collectionId is required" });
    }

    const skip = (page - 1) * pageSize;
    const take = parseInt(pageSize);

    // Lấy tổng số API tests cho phân trang
    const totalCount = await prismaClient.api_tests.count({
      where: { collection_id: collectionId },
    });

    // Lấy danh sách API tests theo collectionId và phân trang
    const tests = await prismaClient.api_tests.findMany({
      where: { collection_id: collectionId },
      orderBy: { id: "desc" }, // Có thể thay đổi nếu cần sắp xếp khác
      skip,
      take,
    });

    res.json({
      data: tests,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error("Error fetching API tests:", error);
    res.status(500).json({ error: "Failed to fetch API tests" });
  }
});
// Cập nhật API Test

app.put("/api-tests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, method, url, headers, body, response, status_code } =
      req.body;

    const updatedTest = await prismaClient.api_tests.update({
      where: { id },
      data: { name, method, url, headers, body, response, status_code },
    });

    res.json(updatedTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update API test" });
  }
});

// 📌 Tạo API Collection
app.post("/api-collections", async (req, res) => {
  try {
    const { name, description, user_id } = req.body;

    const newCollection = await prismaClient.api_collections.create({
      data: {
        name,
        description,
        user_id,
      },
    });

    res.json(newCollection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create API collection" });
  }
});

// 📌 Lấy API Collections theo userId
app.get("/api-collections", async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const skip = (page - 1) * pageSize;
    const take = parseInt(pageSize);

    // Lấy tổng số collections cho phân trang
    const totalCount = await prismaClient.api_collections.count({
      where: { user_id: userId },
    });

    // Lấy danh sách collections theo phân trang
    const collections = await prismaClient.api_collections.findMany({
      where: { user_id: userId },
      skip,
      take,
    });

    res.json({
      data: collections,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error("Error fetching API collections:", error);
    res.status(500).json({ error: "Failed to fetch API collections" });
  }
});

// xóa api collection
app.delete("/api-collections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem collection có tồn tại không
    const collection = await prismaClient.api_collections.findUnique({
      where: { id },
    });

    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: "Collection not found" });
    }

    // Xóa dữ liệu liên quan trước
    await prismaClient.$transaction([
      prismaClient.test_results.deleteMany({
        where: { collection_run: { collection_id: id } },
      }),
      prismaClient.collection_runs.deleteMany({
        where: { collection_id: id },
      }),
      prismaClient.api_tests.deleteMany({
        where: { collection_id: id },
      }),
      prismaClient.test_schedules.deleteMany({
        where: { collection_id: id },
      }),
      prismaClient.api_collections.delete({
        where: { id },
      }),
    ]);

    res.json({ success: true, message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cập nhật API Collection
app.put("/api-collections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedCollection = await prismaClient.api_collections.update({
      where: { id },
      data: { name, description },
    });

    res.json(updatedCollection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update API collection" });
  }
});

// Run Collection
app.post("/run-collection", async (req, res) => {
  try {
    const { collectionId, userId } = req.body;

    if (!collectionId) {
      throw new Error("Collection ID is required");
    }

    try {
      // Get tests in the collection
      const tests = await prismaClient.api_tests.findMany({
        where: {
          collection_id: collectionId,
        },
      });

      console.log(tests);

      if (!tests || tests.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No tests found in collection",
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get collection details for reporting
      const collection = await prismaClient.api_collections.findUnique({
        where: { id: collectionId },
        select: { name: true },
      });

      // Create a collection run record
      const run = await prismaClient.collection_runs.create({
        data: {
          collection_id: collectionId,
          user_id: userId,
          status: "running",
          total_tests: tests.length,
          success_count: 0,
          failure_count: 0,
          total_duration: 0,
          created_at: new Date(),
          completed_at: new Date(),
          test_schedules_id: null,
        },
      });

      const results = await Promise.all(
        tests.map(async (test) => {
          try {
            const startTime = Date.now();

            const headers = {
              "Content-Type": "application/json",
            };

            if (test.headers && typeof test.headers === "object") {
              Object.entries(test.headers).forEach(([key, value]) => {
                headers[key] = String(value);
              });
            }

            // Xử lý API key nếu cần
            if (test.url.includes("api.openweathermap.org")) {
              headers[
                "Authorization"
              ] = `Bearer ${process.env.OPENWEATHER_API_KEY}`;
            }

            const response = await fetch(test.url, {
              method: test.method,
              headers,
              body: test.body
                ? JSON.stringify(JSON.parse(test.body))
                : undefined,
            });

            console.log(response.status);

            const duration = Date.now() - startTime;
            const responseText = await response.text();

            return {
              test_id: test.id,
              collection_run_id: run.id,
              status_code: response.status,
              duration,
              error:
                response.status !== test.status_code
                  ? "Status code mismatch"
                  : null,
              response: responseText,
              created_at: new Date(), // Thêm created_at
            };
          } catch (error) {
            return {
              test_id: test.id,
              collection_run_id: run.id,
              status_code: 0,
              duration: 0,
              error: error.message,
              response: JSON.stringify({ error: error.message }),
              created_at: new Date(), // Thêm created_at
            };
          }
        })
      );

      // Lưu test_results vào database
      await prismaClient.test_results.createMany({ data: results });

      // Cập nhật collection_runs với kết quả
      const successCount = results.filter(
        (r) => r.status_code >= 200 && r.status_code < 400
      ).length;

      const failureCount = results.filter(
        (r) => r.status_code >= 400 && r.status_code < 600
      ).length;

      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

      await prismaClient.collection_runs.update({
        where: { id: run.id },
        data: {
          status: "completed",
          completed_at: new Date(), // Thêm completed_at
          success_count: successCount,
          failure_count: failureCount,
          total_duration: totalDuration,
        },
      });

      return res.json({ success: true, runId: run.id });
    } catch (error) {
      console.error("Error running collection:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error running collection:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// create test-schedules
app.post("/test-schedules", async (req, res) => {
  try {
    const {
      name,
      collection_id,
      frequency,
      selected_days,
      timer_type,
      minute_interval,
      hour_interval,
      day_time,
      week_day,
      week_time,
      send_email,
      user_id,
      recipient_email,
    } = req.body;

    // 🛑 Kiểm tra dữ liệu bắt buộc
    if (
      !name ||
      !frequency ||
      !timer_type ||
      minute_interval === undefined ||
      !user_id
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔹 Tạo lịch trình mới
    const schedule = await prismaClient.test_schedules.create({
      data: {
        name,
        collection_id,
        frequency,
        selected_days: selected_days || [], // ✅ Đảm bảo đúng định dạng
        timer_type,
        minute_interval,
        hour_interval: hour_interval || 0, // ✅ Mặc định là 0 nếu không có
        day_time: day_time || "", // ✅ Mặc định là rỗng nếu không có
        week_day: week_day, // ✅ Mặc định là 0 nếu
        week_time: week_time || "", // ✅ Mặc định là rỗng nếu không có
        send_email,
        user_id,
        recipient_email: recipient_email || "",
      },
    });

    res.status(201).json({
      message: "Schedule created successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);

    // 🔹 Xử lý lỗi Prisma
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ error: "Invalid user_id: User does not exist" });
    }

    res.status(500).json({ error: "Failed to create schedule" });
  }
});
// get test schedules
app.get("/test-schedules", async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const pageNumber = Number(page);
    const size = Number(pageSize);
    const skip = (pageNumber - 1) * size;
    const take = size;

    // Lấy tổng số test_schedules của user
    const totalCount = await prismaClient.test_schedules.count({
      where: { user_id: userId },
    });

    // Lấy danh sách test_schedules với phân trang
    const schedules = await prismaClient.test_schedules.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take,
      select: {
        id: true,
        user_id: true,
        name: true,
        collection_id: true,
        active: true,
        frequency: true,
        selected_days: true,
        timer_type: true,
        minute_interval: true,
        hour_interval: true,
        day_time: true,
        week_day: true,
        week_time: true,
        send_email: true,
        recipient_email: true,
        created_at: true,
      },
    });

    // Lấy danh sách collection names từ bảng `api_collections`
    const collectionIds = schedules.map((s) => s.collection_id).filter(Boolean);
    const collections = await prismaClient.api_collections.findMany({
      where: { id: { in: collectionIds } },
      select: { id: true, name: true },
    });

    // Map tên collection vào test_schedules
    const formattedSchedules = schedules.map((s) => ({
      ...s,
      collection_name:
        collections.find((c) => c.id === s.collection_id)?.name ||
        "Unknown Collection",
    }));

    res.json({
      data: formattedSchedules,
      totalCount,
      page: pageNumber,
      pageSize: size,
      totalPages: Math.ceil(totalCount / size),
    });
  } catch (error) {
    console.error("Error fetching test schedules:", error);
    res.status(500).json({ error: "Failed to fetch test schedules" });
  }
});
// update test schedules
app.put("/test-schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const updatedSchedule = await prismaClient.test_schedules.update({
      where: { id },
      data: {
        active,
      },
    });

    res.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating schedule status:", error);
    res.status(500).json({ error: "Failed to update schedule status" });
  }
});
// delete test schedules
app.delete("/test-schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prismaClient.test_schedules.delete({
      where: { id },
    });

    res.json(schedule);
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});
// Run Schedule
app.post("/run-schedule/:scheduleId", async (req, res) => {
  const { scheduleId } = req.params;

  try {
    // Lấy thông tin test_schedules
    const schedule = await prismaClient.test_schedules.findUnique({
      where: {
        id: scheduleId,
      },
      include: {
        api_collection: {
          include: {
            api_tests: true, // If you want to include tests in the collection
          },
        },
        User: true,
        collection_runs: true,
      },
    });

    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    // Lấy thông tin collection
    const collection = await prismaClient.api_collections.findUnique({
      where: { id: schedule.collection_id ?? "" },
      include: { api_tests: true },
    });

    if (!collection)
      return res.status(404).json({ error: "Collection not found" });

    const tests = collection.api_tests;
    if (!tests || tests.length === 0) {
      return res
        .status(404)
        .json({ error: "No tests found for this collection" });
    }

    // Tạo mới collection_runs với created_at
    const run = await prismaClient.collection_runs.create({
      data: {
        collection_id: collection.id,
        status: "running",
        total_tests: tests.length,
        success_count: 0,
        failure_count: 0,
        total_duration: 0,
        user_id: schedule.user_id,
        test_schedules_id: scheduleId,
        created_at: new Date(), // Thêm created_at
      },
    });

    // Chạy từng test
    const results = await Promise.all(
      tests.map(async (test) => {
        try {
          const startTime = Date.now();

          const headers = {
            "Content-Type": "application/json",
          };

          if (test.headers && typeof test.headers === "object") {
            Object.entries(test.headers).forEach(([key, value]) => {
              headers[key] = String(value);
            });
          }

          // Xử lý API key nếu cần
          if (test.url.includes("api.openweathermap.org")) {
            headers[
              "Authorization"
            ] = `Bearer ${process.env.OPENWEATHER_API_KEY}`;
          }

          const response = await fetch(test.url, {
            method: test.method,
            headers,
            body: test.body ? JSON.stringify(JSON.parse(test.body)) : undefined,
          });

          const duration = Date.now() - startTime;
          const responseText = await response.text();

          return {
            test_id: test.id,
            collection_run_id: run.id,
            status_code: response.status,
            duration,
            error:
              response.status !== test.status_code
                ? "Status code mismatch"
                : null,
            response: responseText,
            created_at: new Date(), // Thêm created_at
          };
        } catch (error) {
          return {
            test_id: test.id,
            collection_run_id: run.id,
            status_code: 0,
            duration: 0,
            error: error.message,
            response: JSON.stringify({ error: error.message }),
            created_at: new Date(), // Thêm created_at
          };
        }
      })
    );

    // Lưu test_results vào database
    await prismaClient.test_results.createMany({ data: results });

    // Cập nhật collection_runs với kết quả
    const successCount = results.filter(
      (r) => r.status_code >= 200 && r.status_code < 400
    ).length;

    const failureCount = results.filter(
      (r) => r.status_code >= 400 && r.status_code < 600
    ).length;

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    await prismaClient.collection_runs.update({
      where: { id: run.id },
      data: {
        status: "completed",
        completed_at: new Date(), // Thêm completed_at
        success_count: successCount,
        failure_count: failureCount,
        total_duration: totalDuration,
      },
    });

    return res.json({ success: true, runId: run.id });
  } catch (error) {
    console.error("Error running schedule:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
// get test run history
app.get("/test-run-history", async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Tính tổng số collection_runs của user
    const totalCount = await prismaClient.collection_runs.count({
      where: { user_id: userId },
    });

    // Tính toán phân trang
    const from = (page - 1) * pageSize;

    // Truy vấn danh sách test runs có phân trang
    const runs = await prismaClient.collection_runs.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        collection_id: true,
        status: true,
        created_at: true,
        completed_at: true,
        total_tests: true,
        success_count: true,
        failure_count: true,
        total_duration: true,
        api_collection: {
          select: { name: true },
        },
      },
      orderBy: { created_at: "desc" },
      skip: from,
      take: pageSize,
    });

    // Định dạng dữ liệu cho frontend
    const runsWithCollectionNames = runs.map((run) => ({
      id: run.id,
      collection_id: run.collection_id || "",
      collection_name: run.api_collection?.name || "Unknown Collection",
      created_at: run.created_at,
      status: run.status,
      total_tests: run.total_tests || 0,
      success_count: run.success_count || 0,
      failure_count: run.failure_count || 0,
      total_duration: run.total_duration || 0,
    }));

    return res.json({
      data: runsWithCollectionNames,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error("Error fetching test-run-history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
// get test run details
app.get("/test-run-details/:runId", async (req, res) => {
  try {
    const { runId } = req.params;

    const runData = await prismaClient.collection_runs.findUnique({
      where: { id: runId },
      include: {
        api_collection: {
          select: { name: true },
        },
      },
    });

    if (!runData) {
      return res.status(404).json({ error: "Run not found" });
    }

    const runWithCollectionName = {
      ...runData,
      collection_name: runData.api_collection?.name || "Unknown Collection",
    };

    const results = await prismaClient.test_results.findMany({
      where: { collection_run_id: runId },
      include: {
        api_test: {
          select: {
            name: true,
            method: true,
            url: true,
          },
        },
      },
    });

    const resultsWithTestNames = results.map((result) => ({
      id: result.id,
      test_id: result.test_id,
      status_code: result.status_code || 0,
      duration: result.duration || 0,
      error: result.error || "",
      response: result.response || "",
      test_name: result.api_test?.name || "Unknown Test",
      test_method: result.api_test?.method || "GET",
      test_url: result.api_test?.url || "",
    }));

    return res.json({
      run: runWithCollectionName,
      results: resultsWithTestNames,
    });
  } catch (error) {
    console.error("Error fetching test-run-details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});
