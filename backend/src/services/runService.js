
// Helper function to make HTTP request
const makeRequest = async (test) => {
  try {
    const startTime = Date.now();

    const headers = test.headers || {};
    const options = {
      method: test.method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(test.method) && test.body) {
      options.body = test.body;
    }

    const response = await fetch(test.url, options);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Get response body
    let responseBody;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    return {
      statusCode: response.status,
      duration,
      response: responseBody,
      error: null,
    };
  } catch (error) {
    console.error('Error making request:', error);
    return {
      statusCode: 0,
      duration: 0,
      response: null,
      error: error.message,
    };
  }
};

// Run a single test
const runSingleTest = async (prisma, test, userId) => {
  try {
    // Create a collection run for tracking
    const run = await prisma.collectionRun.create({
      data: {
        status: 'running',
        totalTests: 1,
        userId,
        collectionId: test.collectionId || userId, // Use userId as fallback if no collection
      },
    });

    // Execute the test
    const result = await makeRequest(test);

    // Store the test result
    const testResult = await prisma.testResult.create({
      data: {
        statusCode: result.statusCode,
        duration: result.duration,
        error: result.error,
        response: result.response,
        testId: test.id,
        collectionRunId: run.id,
      },
    });

    // Update the run with results
    const success = !result.error && (result.statusCode >= 200 && result.statusCode < 400);
    
    await prisma.collectionRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        successCount: success ? 1 : 0,
        failureCount: success ? 0 : 1,
        totalDuration: result.duration,
      },
    });

    return {
      runId: run.id,
      testResult,
      success,
    };
  } catch (error) {
    console.error('Error running test:', error);
    throw error;
  }
};

// Run a collection of tests
const runCollection = async (prisma, collection, userId) => {
  try {
    // Get tests in this collection
    const tests = await prisma.test.findMany({
      where: { collectionId: collection.id },
    });

    if (tests.length === 0) {
      throw new Error('No tests found in this collection');
    }

    // Create a collection run
    const run = await prisma.collectionRun.create({
      data: {
        status: 'running',
        totalTests: tests.length,
        userId,
        collectionId: collection.id,
      },
    });

    // Run each test
    const results = await Promise.all(tests.map(async (test) => {
      try {
        const result = await makeRequest(test);
        
        // Store the test result
        return await prisma.testResult.create({
          data: {
            statusCode: result.statusCode,
            duration: result.duration,
            error: result.error,
            response: result.response,
            testId: test.id,
            collectionRunId: run.id,
          },
        });
      } catch (error) {
        console.error('Error running test:', error);
        return await prisma.testResult.create({
          data: {
            statusCode: 0,
            duration: 0,
            error: error.message,
            response: null,
            testId: test.id,
            collectionRunId: run.id,
          },
        });
      }
    }));

    // Count successes and failures
    const successCount = results.filter(result => {
      return !result.error && (result.statusCode >= 200 && result.statusCode < 400);
    }).length;

    const failureCount = tests.length - successCount;
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);

    // Update the run with results
    const updatedRun = await prisma.collectionRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        successCount,
        failureCount,
        totalDuration,
      },
    });

    return {
      runId: run.id,
      totalTests: tests.length,
      successCount,
      failureCount,
      totalDuration,
    };
  } catch (error) {
    console.error('Error running collection:', error);
    throw error;
  }
};

exports.runService = {
  runSingleTest,
  runCollection,
};
