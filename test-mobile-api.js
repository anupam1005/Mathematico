#!/usr/bin/env node

/**
 * Test script to verify mobile API endpoints
 */

const https = require('https');

const BASE_URL = 'https://mathematico-backend-new.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function testEndpoints() {
  console.log('🧪 Testing Mathematico Serverless API Endpoints\n');
  
  const endpoints = [
    { name: 'Root API', url: `${BASE_URL}/api/v1` },
    { name: 'Health Check', url: `${BASE_URL}/health` },
    { name: 'Mobile Health', url: `${BASE_URL}/api/v1/mobile/health` },
    { name: 'Mobile Books', url: `${BASE_URL}/api/v1/mobile/books` },
    { name: 'Mobile Courses', url: `${BASE_URL}/api/v1/mobile/courses` },
    { name: 'Mobile Live Classes', url: `${BASE_URL}/api/v1/mobile/live-classes` },
    { name: 'Mobile App Info', url: `${BASE_URL}/api/v1/mobile/app-info` },
    { name: 'Auth Info', url: `${BASE_URL}/api/v1/auth` },
    { name: 'Admin Info', url: `${BASE_URL}/api/v1/admin` }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const result = await makeRequest(endpoint.url);
      
      if (result.status === 200) {
        console.log(`   ✅ Status: ${result.status} - SUCCESS`);
        if (result.data.success !== undefined) {
          console.log(`   📊 Success: ${result.data.success}`);
        }
        if (result.data.message) {
          console.log(`   💬 Message: ${result.data.message}`);
        }
      } else {
        console.log(`   ❌ Status: ${result.status} - FAILED`);
        if (result.data.message) {
          console.log(`   💬 Error: ${result.data.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎯 Test Summary:');
  console.log('   - If mobile endpoints are failing, there might be a deployment issue');
  console.log('   - Check Vercel logs: vercel logs');
  console.log('   - Redeploy if needed: vercel --prod');
}

testEndpoints().catch(console.error);
