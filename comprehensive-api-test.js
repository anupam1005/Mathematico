// Comprehensive API Testing Script for Mathematico
// This script tests all endpoints to ensure everything works before APK build

const BASE_URL = 'https://mathematico-backend-new.vercel.app'; // Serverless backend
// const BASE_URL = 'http://10.148.37.132:5002'; // Local backend for testing

const API_ENDPOINTS = {
  // Health and System
  health: '/health',
  root: '/',
  apiRoot: '/api/v1',
  
  // Authentication
  auth: {
    root: '/api/v1/auth',
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    logout: '/api/v1/auth/logout',
    profile: '/api/v1/auth/profile',
    refresh: '/api/v1/auth/refresh-token',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password',
    verifyEmail: '/api/v1/auth/verify-email',
    health: '/api/v1/auth/health',
    testDatabase: '/api/v1/auth/test-database',
    verifyUsers: '/api/v1/auth/verify-users'
  },
  
  // Admin
  admin: {
    root: '/api/v1/admin',
    dashboard: '/api/v1/admin/dashboard',
    users: '/api/v1/admin/users',
    books: '/api/v1/admin/books',
    courses: '/api/v1/admin/courses',
    liveClasses: '/api/v1/admin/live-classes',
    payments: '/api/v1/admin/payments',
    settings: '/api/v1/admin/settings',
    info: '/api/v1/admin/info'
  },
  
  // Mobile
  mobile: {
    root: '/api/v1/mobile',
    books: '/api/v1/mobile/books',
    courses: '/api/v1/mobile/courses',
    liveClasses: '/api/v1/mobile/live-classes',
    payments: '/api/v1/mobile/payments',
    settings: '/api/v1/mobile/settings',
    health: '/api/v1/mobile/health'
  },
  
  // Student
  student: {
    root: '/api/v1/student',
    profile: '/api/v1/student/profile',
    enrollments: '/api/v1/student/enrollments',
    progress: '/api/v1/student/progress'
  },
  
  // Users
  users: {
    root: '/api/v1/users',
    profile: '/api/v1/users/profile'
  },
  
  // Payments
  payments: {
    root: '/api/v1/payments',
    createOrder: '/api/v1/payments/create-order',
    verify: '/api/v1/payments/verify',
    history: '/api/v1/payments/history',
    config: '/api/v1/payments/config'
  }
};

// Test credentials
const TEST_CREDENTIALS = {
  admin: {
    email: 'dc2006089@gmail.com',
    password: 'Myname*321'
  },
  student: {
    email: 'test@student.com',
    password: 'password123'
  }
};

let authToken = null;

// Utility functions
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data: data,
      url: url
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message,
      url: url
    };
  }
};

const logResult = (testName, result) => {
  const status = result.success ? '✅' : '❌';
  const statusCode = result.status ? ` (${result.status})` : '';
  console.log(`${status} ${testName}${statusCode}`);
  
  if (!result.success) {
    console.log(`   Error: ${result.error || result.data?.message || 'Unknown error'}`);
  }
  
  if (result.data && result.data.message) {
    console.log(`   Message: ${result.data.message}`);
  }
};

// Test functions
const testHealthEndpoints = async () => {
  console.log('\n🏥 Testing Health Endpoints...');
  
  const healthResult = await makeRequest(`${BASE_URL}/health`);
  logResult('Health Check', healthResult);
  
  const rootResult = await makeRequest(`${BASE_URL}/`);
  logResult('Root Endpoint', rootResult);
  
  const apiRootResult = await makeRequest(`${BASE_URL}/api/v1`);
  logResult('API Root', apiRootResult);
  
  return healthResult.success && rootResult.success && apiRootResult.success;
};

const testAuthEndpoints = async () => {
  console.log('\n🔐 Testing Authentication Endpoints...');
  
  // Test auth root
  const authRootResult = await makeRequest(`${BASE_URL}/api/v1/auth`);
  logResult('Auth Root', authRootResult);
  
  // Test admin login
  const adminLoginResult = await makeRequest(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS.admin)
  });
  logResult('Admin Login', adminLoginResult);
  
  if (adminLoginResult.success && adminLoginResult.data?.data?.accessToken) {
    authToken = adminLoginResult.data.data.accessToken;
    console.log('   🔑 Auth token obtained for further tests');
  }
  
  // Test auth health
  const authHealthResult = await makeRequest(`${BASE_URL}/api/v1/auth/health`);
  logResult('Auth Health', authHealthResult);
  
  // Test database connection
  const dbTestResult = await makeRequest(`${BASE_URL}/api/v1/auth/test-database`);
  logResult('Database Test', dbTestResult);
  
  return adminLoginResult.success;
};

const testAdminEndpoints = async () => {
  console.log('\n👑 Testing Admin Endpoints...');
  
  if (!authToken) {
    console.log('   ⚠️ No auth token available, skipping admin tests');
    return false;
  }
  
  // Test admin root
  const adminRootResult = await makeRequest(`${BASE_URL}/api/v1/admin`);
  logResult('Admin Root', adminRootResult);
  
  // Test dashboard
  const dashboardResult = await makeRequest(`${BASE_URL}/api/v1/admin/dashboard`);
  logResult('Admin Dashboard', dashboardResult);
  
  // Test users
  const usersResult = await makeRequest(`${BASE_URL}/api/v1/admin/users`);
  logResult('Admin Users', usersResult);
  
  // Test books
  const booksResult = await makeRequest(`${BASE_URL}/api/v1/admin/books`);
  logResult('Admin Books', booksResult);
  
  // Test courses
  const coursesResult = await makeRequest(`${BASE_URL}/api/v1/admin/courses`);
  logResult('Admin Courses', coursesResult);
  
  // Test live classes
  const liveClassesResult = await makeRequest(`${BASE_URL}/api/v1/admin/live-classes`);
  logResult('Admin Live Classes', liveClassesResult);
  
  // Test payments
  const paymentsResult = await makeRequest(`${BASE_URL}/api/v1/admin/payments`);
  logResult('Admin Payments', paymentsResult);
  
  // Test settings
  const settingsResult = await makeRequest(`${BASE_URL}/api/v1/admin/settings`);
  logResult('Admin Settings', settingsResult);
  
  // Test info
  const infoResult = await makeRequest(`${BASE_URL}/api/v1/admin/info`);
  logResult('Admin Info', infoResult);
  
  return dashboardResult.success;
};

const testMobileEndpoints = async () => {
  console.log('\n📱 Testing Mobile Endpoints...');
  
  // Test mobile root
  const mobileRootResult = await makeRequest(`${BASE_URL}/api/v1/mobile`);
  logResult('Mobile Root', mobileRootResult);
  
  // Test mobile books
  const mobileBooksResult = await makeRequest(`${BASE_URL}/api/v1/mobile/books`);
  logResult('Mobile Books', mobileBooksResult);
  
  // Test mobile courses
  const mobileCoursesResult = await makeRequest(`${BASE_URL}/api/v1/mobile/courses`);
  logResult('Mobile Courses', mobileCoursesResult);
  
  // Test mobile live classes
  const mobileLiveClassesResult = await makeRequest(`${BASE_URL}/api/v1/mobile/live-classes`);
  logResult('Mobile Live Classes', mobileLiveClassesResult);
  
  // Test mobile settings
  const mobileSettingsResult = await makeRequest(`${BASE_URL}/api/v1/mobile/settings`);
  logResult('Mobile Settings', mobileSettingsResult);
  
  // Test mobile health
  const mobileHealthResult = await makeRequest(`${BASE_URL}/api/v1/mobile/health`);
  logResult('Mobile Health', mobileHealthResult);
  
  return mobileRootResult.success;
};

const testPaymentEndpoints = async () => {
  console.log('\n💳 Testing Payment Endpoints...');
  
  // Test payment root
  const paymentRootResult = await makeRequest(`${BASE_URL}/api/v1/payments`);
  logResult('Payment Root', paymentRootResult);
  
  // Test payment config
  const paymentConfigResult = await makeRequest(`${BASE_URL}/api/v1/payments/config`);
  logResult('Payment Config', paymentConfigResult);
  
  // Test payment history (requires auth)
  if (authToken) {
    const paymentHistoryResult = await makeRequest(`${BASE_URL}/api/v1/payments/history`);
    logResult('Payment History', paymentHistoryResult);
  }
  
  return paymentConfigResult.success;
};

const testStudentEndpoints = async () => {
  console.log('\n🎓 Testing Student Endpoints...');
  
  if (!authToken) {
    console.log('   ⚠️ No auth token available, skipping student tests');
    return false;
  }
  
  // Test student root
  const studentRootResult = await makeRequest(`${BASE_URL}/api/v1/student`);
  logResult('Student Root', studentRootResult);
  
  // Test student profile
  const studentProfileResult = await makeRequest(`${BASE_URL}/api/v1/student/profile`);
  logResult('Student Profile', studentProfileResult);
  
  return studentRootResult.success;
};

const testUserEndpoints = async () => {
  console.log('\n👤 Testing User Endpoints...');
  
  if (!authToken) {
    console.log('   ⚠️ No auth token available, skipping user tests');
    return false;
  }
  
  // Test user profile
  const userProfileResult = await makeRequest(`${BASE_URL}/api/v1/users/profile`);
  logResult('User Profile', userProfileResult);
  
  return userProfileResult.success;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive API Testing for Mathematico');
  console.log(`📡 Testing against: ${BASE_URL}`);
  console.log('=' * 60);
  
  const results = {
    health: false,
    auth: false,
    admin: false,
    mobile: false,
    payment: false,
    student: false,
    user: false
  };
  
  try {
    // Run all tests
    results.health = await testHealthEndpoints();
    results.auth = await testAuthEndpoints();
    results.admin = await testAdminEndpoints();
    results.mobile = await testMobileEndpoints();
    results.payment = await testPaymentEndpoints();
    results.student = await testStudentEndpoints();
    results.user = await testUserEndpoints();
    
    // Generate summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=' * 60);
    
    Object.entries(results).forEach(([category, success]) => {
      const status = success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${category.toUpperCase()}`);
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    
    if (successRate >= 80) {
      console.log('🎉 App is ready for APK build!');
    } else {
      console.log('⚠️ Some issues need to be fixed before APK build');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
    return results;
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, API_ENDPOINTS, TEST_CREDENTIALS };
}

// Run tests if called directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runMathematicoTests = runAllTests;
  console.log('🧪 Tests loaded! Run runMathematicoTests() to start testing');
} else {
  // Node.js environment
  runAllTests();
}
