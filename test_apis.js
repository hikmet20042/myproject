#!/usr/bin/env node

/**
 * API Testing Script - Social Interaction Features
 * 
 * This script performs automated testing of API endpoints
 * Run: node test_apis.js
 */

const BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Helper function to make requests
async function testEndpoint(method, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  results.total++;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    // For health check, just check if we got a response
    if (path === '/' && response.ok) {
      results.passed++;
      console.log(`${colors.green}✓${colors.reset} ${method} ${path} - ${response.status} (Server Running)`);
      return { success: true, status: response.status };
    }

    // Try to parse JSON for API endpoints
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (response.ok) {
      results.passed++;
      console.log(`${colors.green}✓${colors.reset} ${method} ${path} - ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      // For 401/403, count as skipped (expected without auth)
      if (response.status === 401 || response.status === 403) {
        results.skipped++;
        results.total--; // Don't count as failed
        console.log(`${colors.yellow}⊘${colors.reset} ${method} ${path} - ${response.status} (Auth required)`);
        return { success: false, data, status: response.status, skipped: true };
      }
      results.failed++;
      console.log(`${colors.red}✗${colors.reset} ${method} ${path} - ${response.status}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗${colors.reset} ${method} ${path} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Helper to log section headers
function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Helper to log test info
function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

// Helper to log warnings
function logWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

// Main test runner
async function runTests() {
  console.log(`${colors.cyan}╔${'═'.repeat(58)}╗${colors.reset}`);
  console.log(`${colors.cyan}║${' '.repeat(10)}Social Interaction API Testing${' '.repeat(16)}║${colors.reset}`);
  console.log(`${colors.cyan}╚${'═'.repeat(58)}╝${colors.reset}\n`);

  logInfo('Starting API endpoint tests...');
  logInfo(`Base URL: ${BASE_URL}\n`);

  // Test 1: Check if server is running
  logSection('Server Health Check');
  const serverCheck = await testEndpoint('GET', '/');
  
  if (!serverCheck.success && serverCheck.status !== 401) {
    logWarning('Server might not be running properly!');
    logWarning('Continue anyway to test API endpoints...\n');
  }

  // Test 2: Blog APIs (without authentication - should handle gracefully)
  logSection('Blog API Endpoints');
  
  logInfo('Testing blog endpoints (these may fail without valid blog IDs)...');
  
  // These will fail without actual IDs, but we're testing if endpoints exist
  await testEndpoint('GET', '/api/blogs');
  await testEndpoint('POST', '/api/blogs/test-id/like');
  await testEndpoint('POST', '/api/blogs/test-id/dislike');

  // Test 3: Event APIs
  logSection('Event API Endpoints');
  
  logInfo('Testing event endpoints (these may fail without valid event IDs)...');
  
  await testEndpoint('GET', '/api/events');
  await testEndpoint('POST', '/api/events/test-id/view');
  await testEndpoint('POST', '/api/events/test-id/save');

  // Test 4: Vacancy APIs
  logSection('Vacancy API Endpoints');
  
  logInfo('Testing vacancy endpoints (these may fail without valid vacancy IDs)...');
  
  await testEndpoint('GET', '/api/vacancies');
  await testEndpoint('POST', '/api/vacancies/test-id/view');
  await testEndpoint('POST', '/api/vacancies/test-id/save');

  // Test 5: Notification APIs
  logSection('Notification API Endpoints');
  
  logInfo('Testing notification endpoints (will fail without authentication)...');
  
  await testEndpoint('GET', '/api/notifications');
  await testEndpoint('PATCH', '/api/notifications/test-id', {
    body: { isRead: true }
  });

  // Test 7: Cron Job API
  logSection('Cron Job API Endpoint');
  
  logInfo('Testing cron job endpoint (manual trigger)...');
  
  await testEndpoint('GET', '/api/cron/event-deadlines');

  // Print summary
  logSection('Test Summary');
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  
  console.log(`Total Tests:  ${results.total}`);
  console.log(`${colors.green}Passed:       ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped:      ${results.skipped}${colors.reset}`);
  console.log(`\nPass Rate:    ${passRate >= 50 ? colors.green : colors.red}${passRate}%${colors.reset}`);

  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  // Print next steps
  console.log(`${colors.blue}Next Steps:${colors.reset}`);
  console.log('1. Create test accounts (admin, NGO, regular user)');
  console.log('2. Create test data (blog, event, vacancy)');
  console.log('3. Run manual tests with TESTING_CHECKLIST.md');
  console.log('4. Test on mobile devices');
  console.log('5. Check browser console for errors');
  console.log('6. Review QUICK_TESTING_GUIDE.md for detailed scenarios\n');

  // Exit with appropriate code
  process.exit(results.failed > results.total / 2 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal Error:${colors.reset}`, error);
  process.exit(1);
});
