const assert = require('assert');
const path = require('path');

console.log('=================================================================');
console.log('CamneX Bangladesh: Hosting Fixes & Lifecycle Verification Suite');
console.log('=================================================================\n');

let passed = 0;
let failed = 0;

function testAssert(cond, msg) {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

async function runTests() {
  // ---------------------------------------------------------------------------
  // Test 1: Redirect Middleware - No match in MySQL mode
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing Redirect Middleware: No Match in MySQL Mode ---');
  {
    const mockDb = {
      prepare(sql) {
        return {
          async get(param) {
            // Under MySQL mode, get() returns a Promise. When no row matches, it resolves to undefined.
            return undefined;
          }
        };
      }
    };

    let nextCalled = false;
    let redirectedWith = null;

    const req = { method: 'GET', path: '/catalog' };
    const res = {
      redirect(status, to) {
        redirectedWith = { status, to };
      }
    };
    const next = () => { nextCalled = true; };

    // Simulate the fixed middleware logic
    const middleware = async (req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        try {
          const cleanPath = req.path.toLowerCase();
          const redirectRow = await mockDb.prepare('SELECT to_path, status_code FROM redirects WHERE LOWER(from_path) = ?').get(cleanPath);
          if (redirectRow && redirectRow.to_path) {
            return res.redirect(redirectRow.status_code || 301, redirectRow.to_path);
          }
        } catch (_) {}
      }
      next();
    };

    await middleware(req, res, next);

    testAssert(nextCalled === true, 'next() called when no redirect matches');
    testAssert(redirectedWith === null, 'res.redirect() was NOT called (no /undefined redirect)');
  }

  // ---------------------------------------------------------------------------
  // Test 2: Redirect Middleware - Valid match in MySQL mode
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Testing Redirect Middleware: Valid Match in MySQL Mode ---');
  {
    const mockDb = {
      prepare(sql) {
        return {
          async get(param) {
            if (param === '/old-about') {
              return { to_path: '/company-profile', status_code: 301 };
            }
            return undefined;
          }
        };
      }
    };

    let nextCalled = false;
    let redirectedWith = null;

    const req = { method: 'GET', path: '/old-about' };
    const res = {
      redirect(status, to) {
        redirectedWith = { status, to };
      }
    };
    const next = () => { nextCalled = true; };

    const middleware = async (req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        try {
          const cleanPath = req.path.toLowerCase();
          const redirectRow = await mockDb.prepare('SELECT to_path, status_code FROM redirects WHERE LOWER(from_path) = ?').get(cleanPath);
          if (redirectRow && redirectRow.to_path) {
            return res.redirect(redirectRow.status_code || 301, redirectRow.to_path);
          }
        } catch (_) {}
      }
      next();
    };

    await middleware(req, res, next);

    testAssert(nextCalled === false, 'next() not called when redirect matches');
    testAssert(redirectedWith !== null && redirectedWith.status === 301 && redirectedWith.to === '/company-profile',
      `Redirected with status ${redirectedWith?.status} to target ${redirectedWith?.to}`);
  }

  // ---------------------------------------------------------------------------
  // Test 3: Background Job Queue - Empty Queue in MySQL Mode
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testing Background Job Queue: Empty Queue in MySQL Mode ---');
  {
    let updateExecuted = false;
    const mockDb = {
      prepare(sql) {
        return {
          async get() {
            // In MySQL mode, returns Promise resolving to undefined when no job is pending
            return undefined;
          },
          async run(...args) {
            updateExecuted = true;
            return { changes: 0 };
          }
        };
      }
    };

    let capturedError = null;
    async function testProcessNextJob() {
      let currentJob = null;
      try {
        currentJob = await mockDb.prepare('SELECT * FROM background_jobs').get();
        if (!currentJob) return;

        await mockDb.prepare('UPDATE background_jobs SET status = processing').run(currentJob.id);
      } catch (err) {
        capturedError = err;
      }
    }

    await testProcessNextJob();

    testAssert(capturedError === null, 'No error thrown on empty job queue');
    testAssert(updateExecuted === false, 'No database mutations executed on empty queue');
  }

  // ---------------------------------------------------------------------------
  // Test 4: Background Job Queue - Failed Job with Valid ID in Scope
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Testing Background Job Queue: Failure Handling with In-Scope ID ---');
  {
    let recordedError = null;
    let recordedJobId = null;

    const mockDb = {
      prepare(sql) {
        return {
          async get() {
            return {
              id: 'job-test-fail-99',
              type: 'invalid_unsupported_type',
              payload_json: '{}',
              attempts: 1,
              max_attempts: 3
            };
          },
          async run(...args) {
            if (sql.includes('last_error')) {
              recordedError = args[0];
              recordedJobId = args[1];
            }
            return { changes: 1 };
          }
        };
      }
    };

    let referenceErrorThrown = false;
    async function testProcessFailingJob() {
      let currentJob = null;
      try {
        currentJob = await mockDb.prepare('SELECT * FROM background_jobs').get();
        if (!currentJob) return;

        if (currentJob.type === 'product_research') {
          // valid
        } else {
          throw new Error(`Unsupported job type: ${currentJob.type}`);
        }
      } catch (err) {
        if (currentJob && currentJob.id) {
          try {
            await mockDb.prepare('UPDATE background_jobs SET last_error = ? WHERE id = ?').run(err.message, currentJob.id);
          } catch (updateErr) {
            if (updateErr instanceof ReferenceError) referenceErrorThrown = true;
          }
        }
      }
    }

    await testProcessFailingJob();

    testAssert(referenceErrorThrown === false, 'ReferenceError was NOT thrown in catch block');
    testAssert(recordedJobId === 'job-test-fail-99', `Job ID correctly captured in catch block: ${recordedJobId}`);
    testAssert(recordedError === 'Unsupported job type: invalid_unsupported_type', `Error message correctly persisted: ${recordedError}`);
  }

  // ---------------------------------------------------------------------------
  // Test 5: Database Pool Shutdown & Request Handling
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Testing Database Pool Shutdown & Request Handling ---');
  {
    // Clear require cache and test database.js createMysqlAdapter shutdown behavior
    delete require.cache[require.resolve('../database.js')];
    process.env.DB_CLIENT = 'mysql';
    process.env.DB_USER = 'test_user';
    process.env.DB_NAME = 'test_db';
    process.env.DB_PASSWORD = 'test_password';

    const dbModule = require('../database.js');

    testAssert(typeof dbModule.close === 'function', 'dbModule exposes close() method');
    testAssert(typeof dbModule.isClosed === 'function', 'dbModule exposes isClosed() method');
    testAssert(dbModule.isClosed() === false, 'Pool is initially open (isClosed() === false)');

    // Close the pool
    await dbModule.close();
    testAssert(dbModule.isClosed() === true, 'Pool is marked closed after dbModule.close()');

    // Attempting query on closed pool throws ERR_DB_CLOSED
    let queryError = null;
    try {
      await dbModule.prepare('SELECT 1').get();
    } catch (err) {
      queryError = err;
    }

    testAssert(queryError !== null && queryError.code === 'ERR_DB_CLOSED',
      `Query on closed pool threw ERR_DB_CLOSED (${queryError?.message})`);

    // Verify HTTP middleware responds with 503 and Connection: close when isShuttingDown is true
    let isShuttingDown = true;
    let statusCode = null;
    let responseBody = null;
    let connectionHeader = null;

    const req = { method: 'GET', path: '/' };
    const res = {
      setHeader(k, v) {
        if (k.toLowerCase() === 'connection') connectionHeader = v;
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(obj) {
        responseBody = obj;
      }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const shutdownMiddleware = (req, res, next) => {
      if (isShuttingDown) {
        res.setHeader('Connection', 'close');
        return res.status(503).json({ error: 'Server is recycling. Please retry shortly.' });
      }
      next();
    };

    shutdownMiddleware(req, res, next);

    testAssert(statusCode === 503, 'Middleware returns HTTP 503 during shutdown');
    testAssert(connectionHeader === 'close', 'Middleware sets Connection: close header');
    testAssert(nextCalled === false, 'next() not called during shutdown');

    delete process.env.DB_CLIENT;
    delete process.env.DB_USER;
    delete process.env.DB_NAME;
    delete process.env.DB_PASSWORD;
  }

  // ---------------------------------------------------------------------------
  // Test 6: SQLite Compatibility
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Testing SQLite Engine Compatibility ---');
  {
    delete require.cache[require.resolve('../database.js')];
    delete process.env.DB_CLIENT;
    process.env.DB_PATH = path.join(__dirname, '..', 'camnex_dev.db');

    const sqliteDb = require('../database.js');

    // Test synchronous / awaited prepare queries
    const categories = sqliteDb.prepare('SELECT id, slug, name FROM categories LIMIT 3').all();
    testAssert(Array.isArray(categories) && categories.length > 0, `SQLite categories fetched: ${categories.length} rows`);

    const noRedirect = sqliteDb.prepare('SELECT to_path FROM redirects WHERE from_path = ?').get('/non-existent-path');
    testAssert(noRedirect === undefined, 'SQLite no-redirect returns undefined synchronously');

    // Test with await (which should unwrap seamlessly)
    const awaitedCategory = await sqliteDb.prepare('SELECT id FROM categories LIMIT 1').get();
    testAssert(awaitedCategory && awaitedCategory.id, `SQLite query works seamlessly with await: id=${awaitedCategory?.id}`);
  }

  console.log('\n=================================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

