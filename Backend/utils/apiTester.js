const axios = require('axios');

/**
 * API Endpoint Tester
 * Tests all API endpoints and returns comprehensive results
 */
class APITester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  /**
   * Test a single endpoint
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} headers - Request headers
   * @returns {Promise<Object>} Test result
   */
  async testEndpoint(method, endpoint, data = null, headers = {}) {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const config = {
        method: method.toLowerCase(),
        url: url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 10000
      };

      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      const result = {
        method: method.toUpperCase(),
        endpoint: endpoint,
        url: url,
        status: response.status,
        success: response.status >= 200 && response.status < 300,
        responseTime: `${responseTime}ms`,
        data: response.data,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const result = {
        method: method.toUpperCase(),
        endpoint: endpoint,
        url: url,
        status: error.response?.status || 0,
        success: false,
        responseTime: `${responseTime}ms`,
        error: error.message,
        data: error.response?.data || null,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test all API endpoints
   * @returns {Promise<Object>} Comprehensive test results
   */
  async testAllEndpoints() {
    console.log('🧪 Starting comprehensive API testing...');
    
    const endpoints = [
      // Health and info endpoints
      { method: 'GET', endpoint: '/' },
      { method: 'GET', endpoint: '/api/v1' },
      { method: 'GET', endpoint: '/api/v1/health' },
      
      // Auth endpoints
      { method: 'GET', endpoint: '/api/v1/auth' },
      { method: 'GET', endpoint: '/api/v1/auth/test' },
      { method: 'POST', endpoint: '/api/v1/auth/login', data: { email: 'dc2006089@gmail.com', password: 'Myname*321' } },
      { method: 'POST', endpoint: '/api/v1/auth/register', data: { name: 'Test User', email: 'test@example.com', password: 'password123' } },
      { method: 'POST', endpoint: '/api/v1/auth/logout' },
      
      // Mobile endpoints
      { method: 'GET', endpoint: '/api/v1/mobile' },
      { method: 'GET', endpoint: '/api/v1/mobile/test' },
      { method: 'GET', endpoint: '/api/v1/mobile/courses' },
      { method: 'GET', endpoint: '/api/v1/mobile/books' },
      { method: 'GET', endpoint: '/api/v1/mobile/live-classes' },
      { method: 'GET', endpoint: '/api/v1/mobile/app-info' },
      
      // Admin endpoints (without auth for testing)
      { method: 'GET', endpoint: '/api/v1/admin/dashboard' },
      { method: 'GET', endpoint: '/api/v1/admin/books' },
      { method: 'GET', endpoint: '/api/v1/admin/users' },
      
      // Student endpoints
      { method: 'GET', endpoint: '/api/v1/student/courses' },
      
      // File upload endpoints
      { method: 'POST', endpoint: '/api/v1/upload' },
      
      // Documentation endpoints
      { method: 'GET', endpoint: '/api-docs' },
      { method: 'GET', endpoint: '/api-docs.json' }
    ];

    // Test all endpoints
    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint.method} ${endpoint.endpoint}...`);
      await this.testEndpoint(endpoint.method, endpoint.endpoint, endpoint.data);
    }

    return this.generateReport();
  }

  /**
   * Generate comprehensive test report
   * @returns {Object} Test report
   */
  generateReport() {
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(2);

    const report = {
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: `${successRate}%`,
        timestamp: new Date().toISOString()
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Generate recommendations based on test results
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const failedEndpoints = this.results.filter(r => !r.success);

    if (failedEndpoints.length > 0) {
      recommendations.push({
        type: 'error',
        message: `${failedEndpoints.length} endpoints failed`,
        details: failedEndpoints.map(e => `${e.method} ${e.endpoint} - ${e.error}`)
      });
    }

    const slowEndpoints = this.results.filter(r => parseInt(r.responseTime) > 5000);
    if (slowEndpoints.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `${slowEndpoints.length} endpoints are slow (>5s)`,
        details: slowEndpoints.map(e => `${e.method} ${e.endpoint} - ${e.responseTime}`)
      });
    }

    const authEndpoints = this.results.filter(r => r.endpoint.includes('/auth/') && !r.success);
    if (authEndpoints.length > 0) {
      recommendations.push({
        type: 'security',
        message: 'Authentication endpoints need attention',
        details: 'Check JWT configuration and token validation'
      });
    }

    return recommendations;
  }

  /**
   * Test specific endpoint with authentication
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Test result
   */
  async testAuthenticatedEndpoints(token) {
    const authHeaders = { Authorization: `Bearer ${token}` };
    
    const authEndpoints = [
      { method: 'GET', endpoint: '/api/v1/auth/profile' },
      { method: 'GET', endpoint: '/api/v1/admin/dashboard' },
      { method: 'GET', endpoint: '/api/v1/student/courses' }
    ];

    console.log('🔐 Testing authenticated endpoints...');
    
    for (const endpoint of authEndpoints) {
      await this.testEndpoint(endpoint.method, endpoint.endpoint, null, authHeaders);
    }

    return this.generateReport();
  }
}

module.exports = APITester;
