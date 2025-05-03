# API Tracker Backend

This is the Node.js backend for the API Tracker application using MySQL and Prisma.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy the `.env.example` file to `.env` and update it with your MySQL credentials:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/api_tracker"
   JWT_SECRET="your-secret-key"
   ```

3. Create the database and run migrations:
   ```
   npx prisma migrate dev
   ```

4. Generate Prisma client:
   ```
   npx prisma generate
   ```

5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user.
- `POST /api/auth/login` - Login and receive a JWT token.
- `GET /api/auth/me` - Get the current authenticated user's details.
- `PUT /api/auth/profile` - Update the authenticated user's profile.

### Collections
- `GET /api/collections` - Retrieve all collections for the authenticated user.
- `POST /api/collections` - Create a new collection.
- `GET /api/collections/:id` - Retrieve details of a specific collection.
- `PUT /api/collections/:id` - Update a specific collection.
- `DELETE /api/collections/:id` - Delete a specific collection.
- `POST /api/collections/:id/run` - Execute all tests in a specific collection.

### Tests
- `GET /api/tests` - Retrieve all tests for the authenticated user.
- `POST /api/tests` - Create a new test.
- `GET /api/tests/collection/:collectionId` - Retrieve all tests within a specific collection.
- `GET /api/tests/:id` - Retrieve details of a specific test.
- `PUT /api/tests/:id` - Update a specific test.
- `DELETE /api/tests/:id` - Delete a specific test.
- `POST /api/tests/:id/run` - Execute a specific test.
- `GET /api/tests/validate` - Validate if a test name already exists in a collection.

### Schedules
- `GET /api/schedules` - Retrieve all schedules for the authenticated user.
- `POST /api/schedules` - Create a new schedule.
- `GET /api/schedules/:id` - Retrieve details of a specific schedule.
- `PUT /api/schedules/:id` - Update a specific schedule.
- `DELETE /api/schedules/:id` - Delete a specific schedule.
- `PATCH /api/schedules/:id/toggle` - Enable or disable a specific schedule.
- `POST /api/schedules/:id/run` - Execute a specific schedule immediately.

### Runs
- `GET /api/runs` - Retrieve the history of test runs.
- `GET /api/runs/:id` - Retrieve details of a specific test run.
- `POST /api/runs/:id/email` - Send an email report for a specific test run.

### Utility Endpoints
- `GET /api/health` - Check the health status of the API server.

## Use Case Diagram: User Registration

```mermaid
graph TB
    subgraph User Registration System
    U((User))
    R[Register Account]
    V[Validate Email]
    H[Hash Password]
    C[Create Account]
    T[Generate Token]
    D[(Database)]
    
    U -->|Submits registration form| R
    R -->|Check email| V
    V -->|Unique email| H
    H -->|Store user| C
    C -->|Save| D
    C -->|Generate JWT| T
    T -->|Return token| U
    
    V -.->|Email exists| U
    end
```

## Sequence Diagram: User Registration

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant Auth as Authentication Service
    participant D as Database

    U->>F: Enter registration details
    F->>F: Validate form input
    
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: POST /api/auth/register
        
        B->>D: Check email existence
        
        alt Email Exists
            D-->>B: Return existing user
            B-->>F: Return 400 error
            F-->>U: Show "Email already exists"
        else Email Available
            B->>Auth: Generate password hash
            Auth-->>B: Return hashed password
            
            B->>D: Save new user
            D-->>B: Confirm user created
            
            B->>Auth: Generate JWT token
            Auth-->>B: Return token
            
            B-->>F: Return user data & token
            F->>F: Store token in localStorage
            F-->>U: Show success & redirect
        end
    end
```

## Sequence Diagram: User Login

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant Auth as Authentication Service
    participant D as Database

    U->>F: Enter login credentials
    F->>F: Validate form input
    
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: POST /api/auth/login
        
        B->>D: Find user by email
        
        alt User Not Found
            D-->>B: Return null
            B-->>F: Return 401 error
            F-->>U: Show "Invalid credentials"
        else User Found
            D-->>B: Return user data
            B->>Auth: Verify password hash
            
            alt Invalid Password
                Auth-->>B: Verification failed
                B-->>F: Return 401 error
                F-->>U: Show "Invalid credentials"
            else Valid Password
                Auth-->>B: Verification success
                B->>Auth: Generate JWT token
                Auth-->>B: Return token
                
                B-->>F: Return user data & token
                F->>F: Store token in localStorage
                F-->>U: Redirect to dashboard
            end
        end
    end
```

## Sequence Diagram: Test API and Save to Collection

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant T as Test Service
    participant D as Database

    U->>F: Enter API endpoint details
    Note over U,F: URL, method, headers, body
    
    alt Invalid API Configuration
        F-->>U: Show validation errors
    else Valid Configuration
        F->>F: Create test request
        F->>T: Send test request
        T->>T: Execute API call
        T-->>F: Return API response
        F-->>U: Display response details
        
        U->>F: Click "Save Test"
        F->>B: GET /api/collections
        B->>D: Fetch user collections
        D-->>B: Return collections
        B-->>F: Display collections list
        
        alt Create New Collection
            U->>F: Click "New Collection"
            F->>F: Show new collection form
            U->>F: Enter collection name
            F->>B: POST /api/collections
            B->>D: Create collection
            D-->>B: Return new collection
            B-->>F: Update collections list
        else Select Existing Collection
            U->>F: Select collection
        end
        
        U->>F: Enter test name & description
        F->>B: POST /api/tests
        B->>D: Save test configuration
        D-->>B: Confirm save
        B-->>F: Return success
        F-->>U: Show success notification
    end
```

## Sequence Diagram: Create New Collection

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database

    U->>F: Click "New Collection"
    F->>F: Show collection form
    
    U->>F: Enter collection details
    Note over U,F: name, description, environment variables
    
    F->>F: Validate form input
    
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: POST /api/collections
        B->>D: Check collection name exists
        
        alt Name Exists
            D-->>B: Return existing collection
            B-->>F: Return 400 error
            F-->>U: Show "Name already exists"
        else Name Available
            B->>D: Create collection
            D-->>B: Return new collection
            B-->>F: Return collection data
            F->>F: Update collections list
            F-->>U: Show success & redirect to collection
        end
    end
```

## Sequence Diagram: Update Collection

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database

    U->>F: Navigate to collection settings
    F->>B: GET /api/collections/:id
    B->>D: Fetch collection details
    D-->>B: Return collection data
    B-->>F: Display collection form
    
    U->>F: Modify collection details
    Note over U,F: name, description, environment variables
    
    F->>F: Validate form input
    
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: PUT /api/collections/:id
        
        alt Name Changed
            B->>D: Check new name availability
            alt Name Exists
                D-->>B: Return conflict
                B-->>F: Return 400 error
                F-->>U: Show "Name already exists"
            else Name Available
                B->>D: Update collection
                D-->>B: Return updated data
                B-->>F: Return success
                F->>F: Update collection in list
                F-->>U: Show success notification
            end
        else Name Unchanged
            B->>D: Update collection
            D-->>B: Return updated data
            B-->>F: Return success
            F->>F: Update collection in list
            F-->>U: Show success notification
        end
    end
```

## Sequence Diagram: Delete Collection

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database

    U->>F: Click delete collection
    F->>F: Show confirmation dialog
    Note over F: Warn about deleting related items
    
    alt Cancel Delete
        U->>F: Click cancel
        F-->>U: Close dialog
    else Confirm Delete
        U->>F: Confirm deletion
        F->>B: DELETE /api/collections/:id
        
        B->>D: Check collection exists
        alt Collection Not Found
            D-->>B: Return null
            B-->>F: Return 404 error
            F-->>U: Show "Collection not found"
        else Collection Found
            B->>D: Begin transaction
            B->>D: Delete related schedules
            B->>D: Delete run history
            B->>D: Delete related tests
            B->>D: Delete collection
            B->>D: Commit transaction
            D-->>B: Confirm deletion
            B-->>F: Return success
            F->>F: Remove from collections list
            F-->>U: Show success & redirect to collections
        end
    end
```

## Sequence Diagram: Add API Test to Collection

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database

    U->>F: Navigate to collection
    F->>B: GET /api/collections/:id
    B->>D: Fetch collection
    D-->>B: Return collection data
    B-->>F: Display collection details

    U->>F: Click "Add API Test"
    F->>F: Show API test form
    
    U->>F: Enter API test details
    Note over U,F: URL, method, headers, body, assertions
    
    F->>F: Validate test input
    
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: POST /api/tests
        B->>D: Check test name uniqueness
        
        alt Name Exists in Collection
            D-->>B: Return conflict
            B-->>F: Return 400 error
            F-->>U: Show "Test name exists"
        else Name Available
            B->>D: Create test
            D-->>B: Return new test
            B-->>F: Return test data
            F->>F: Add test to collection list
            F-->>U: Show success notification
        end
    end
```

## Sequence Diagram: Update API Test

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database

    U->>F: Navigate to test details
    F->>B: GET /api/tests/:id
    B->>D: Fetch test data
    D-->>B: Return test details
    B-->>F: Display test form
    
    U->>F: Modify test details
    Note over U,F: URL, method, headers, body, assertions
    
    F->>F: Validate test input
    
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: PUT /api/tests/:id
        
        alt Name Changed
            B->>D: Check name uniqueness in collection
            alt Name Exists
                D-->>B: Return conflict
                B-->>F: Return 400 error
                F-->>U: Show "Test name exists"
            else Name Available
                B->>D: Update test
                D-->>B: Return updated test
                B-->>F: Return success
                F->>F: Update test in list
                F-->>U: Show success notification
            end
        else Name Unchanged
            B->>D: Update test
            D-->>B: Return updated test
            B-->>F: Return success
            F->>F: Update test in list
            F-->>U: Show success notification
        end
    end
```

## Sequence Diagram: Delete API Test

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database

    U->>F: Click delete test button
    F->>F: Show confirmation dialog
    Note over F: Warn about deleting schedules and history
    
    alt Cancel Delete
        U->>F: Click cancel
        F-->>U: Close dialog
    else Confirm Delete
        U->>F: Confirm deletion
        F->>B: DELETE /api/tests/:id
        
        B->>D: Check test exists
        alt Test Not Found
            D-->>B: Return null
            B-->>F: Return 404 error
            F-->>U: Show "Test not found"
        else Test Found
            B->>D: Begin transaction
                            B->>D: Delete associated schedules
                Note over B,D: Delete schedules using this test
                B->>D: Delete test run history  
                Note over B,D: Delete all test execution results
                B->>D: Delete test
                B->>D: Commit transaction
                D-->>B: Confirm deletion
                B-->>F: Return success
                F->>F: Remove test from list
                F-->>U: Show success notification
            end
        end
    end
```

## Sequence Diagram: Run Collection Tests

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant T as Test Service
    participant D as Database

    U->>F: Click "Run Collection"
    F->>B: POST /api/collections/:id/run
    B->>D: Fetch collection tests
    D-->>B: Return tests list

    B->>T: Initialize test run
    T->>D: Create run record
    
    loop For each test
        T->>T: Execute API test
        Note over T: Apply environment variables
        T->>T: Validate response
        T->>D: Save test result
    end

    T->>D: Update run status
    D-->>B: Return run results
    B-->>F: Return run summary
    
    F->>F: Update test results
    F-->>U: Show run completion status

    alt View Details
        U->>F: Click "View Results"
        F->>B: GET /api/runs/:id
        B->>D: Fetch run details
        D-->>B: Return detailed results
        B-->>F: Display results
        F-->>U: Show detailed report
    end
```

## Sequence Diagram: Create Schedule

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant S as Schedule Service
    participant D as Database
    participant CR as Cron Service

    U->>F: Click "Create Schedule"
    F->>F: Show schedule form
    F->>B: GET /api/collections
    B->>D: Fetch user's collections
    D-->>B: Return collections
    B-->>F: Display collections list

    U->>F: Select collection/test
    U->>F: Enter schedule details
    Note over U,F: Name, description, frequency, time, notifications

    F->>F: Validate form input
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: POST /api/schedules
        B->>D: Check collection/test exists

        alt Collection/Test Not Found
            D-->>B: Return null
            B-->>F: Return 404 error
            F-->>U: Show "Collection/Test not found"
        else Resources Found
            B->>B: Generate cron expression 
            Note over B: Based on frequency & time
            B->>D: Begin transaction
            B->>D: Create schedule record
            D-->>B: Return new schedule

            B->>S: Register schedule
            S->>CR: Create cron job
            Note over S,CR: Set up automated test execution
            CR-->>S: Confirm job creation
            
            B->>D: Update next_run field
            D-->>B: Return updated schedule
            B->>D: Commit transaction

            B-->>F: Return success with schedule
            F->>F: Add to schedules list
            F-->>U: Show success notification
        end
    end
```

## Sequence Diagram: Update Schedule

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant S as Schedule Service
    participant D as Database
    participant CR as Cron Service

    U->>F: Navigate to schedule details
    F->>B: GET /api/schedules/:id
    B->>D: Fetch schedule data
    D-->>B: Return schedule details
    B-->>F: Display schedule form

    U->>F: Modify schedule details
    Note over U,F: Name, frequency, time, notifications

    F->>F: Validate form input
    alt Invalid Input
        F-->>U: Show validation errors
    else Valid Input
        F->>B: PUT /api/schedules/:id
        
        B->>D: Check schedule exists
        alt Schedule Not Found
            D-->>B: Return null
            B-->>F: Return 404 error
            F-->>U: Show "Schedule not found"
        else Schedule Found
            B->>D: Begin transaction
            
            alt Timing Changed
                B->>B: Generate new cron expression
                B->>S: Update schedule registration
                S->>CR: Delete old cron job
                S->>CR: Create new cron job
                CR-->>S: Confirm job update
            end

            B->>D: Update schedule record
            B->>D: Update next_run time
            D-->>B: Return updated schedule
            B->>D: Commit transaction

            B-->>F: Return success with schedule
            F->>F: Update schedule in list
            F-->>U: Show success notification
        end
    end
```

## Sequence Diagram: Delete Schedule

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant S as Schedule Service
    participant D as Database
    participant CR as Cron Service

    U->>F: Click delete schedule button
    F->>F: Show confirmation dialog
    Note over F: Warn about deleting run history

    alt Cancel Delete
        U->>F: Click cancel
        F-->>U: Close dialog
    else Confirm Delete
        U->>F: Confirm deletion
        F->>B: DELETE /api/schedules/:id
        
        B->>D: Check schedule exists
        alt Schedule Not Found
            D-->>B: Return null
            B-->>F: Return 404 error
            F-->>U: Show "Schedule not found"
        else Schedule Found
            B->>D: Begin transaction
            
            B->>S: Unregister schedule
            S->>CR: Delete cron job
            CR-->>S: Confirm job deletion
            Note over S,CR: Stop automated execution
            
            B->>D: Delete run history
            Note over B,D: Remove execution records
            
            B->>D: Delete schedule record
            Note over B,D: Remove schedule data
            
            B->>D: Commit transaction
            D-->>B: Confirm deletion

            B-->>F: Return success
            F->>F: Remove from schedules list
            F->>F: Update UI state
            F-->>U: Show success notification
            Note over F,U: Display confirmation toast
        end
    end
```

## Sequence Diagram: Auto Execute Schedule

```mermaid
sequenceDiagram
    participant CR as Cron Service
    participant S as Schedule Service
    participant B as Backend API
    participant T as Test Service
    participant D as Database
    participant N as Notification Service

    CR->>S: Trigger scheduled execution
    Note over CR,S: Based on cron expression
    
    S->>D: Get schedule details
    D-->>S: Return schedule info
    
    alt Schedule Not Found
        S-->>CR: Log error & skip
    else Schedule Found
        alt Schedule Disabled
            S-->>CR: Skip execution
        else Schedule Active
            S->>D: Begin transaction
            
            S->>D: Create test run record
            D-->>S: Return run ID
            
            alt Single Test
                S->>T: Execute API test
                Note over T: Apply environment variables
                T->>T: Make API request
                T->>T: Validate response
                T->>D: Save test result
            else Collection
                S->>D: Fetch collection tests
                D-->>S: Return tests list
                
                loop Each Test in Collection
                    S->>T: Execute API test
                    Note over T: Apply environment variables
                    T->>T: Make API request
                    T->>T: Validate response
                    T->>D: Save test result
                end
            end
            
            S->>D: Update run status
            S->>D: Update last_run & next_run
            S->>D: Commit transaction
            
            alt Has Notifications Enabled
                S->>N: Send execution report
                Note over N: Email/Webhook notification
                N-->>S: Confirm notification sent
            end
            
            S->>D: Log execution complete
            Note over S,D: Store execution metrics
        end
    end
```

## Notes
- Ensure the `.env` file is properly configured before running the server.
- Use the JWT token received during login for authenticated requests by including it in the `Authorization` header as `Bearer <token>`.
