#!/usr/bin/env node

/**
 * Debug production response to see what's actually being returned
 */

const axios = require('axios');

const BASE_URL = 'https://mathematico-backend-new.vercel.app';

async function debugProductionResponse() {
  console.log('🔍 Debugging Production Response...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'dc2006089@gmail.com',
      password: 'Myname*321'
    });
    
    console.log('Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\nResponse Analysis:');
    console.log('- success:', response.data.success);
    console.log('- message:', response.data.message);
    console.log('- has data:', !!response.data.data);
    
    if (response.data.data) {
      console.log('- has user:', !!response.data.data.user);
      console.log('- has token:', !!response.data.data.token);
      console.log('- has refreshToken:', !!response.data.data.refreshToken);
      console.log('- has tokens object:', !!response.data.data.tokens);
      
      if (response.data.data.tokens) {
        console.log('- tokens.accessToken:', !!response.data.data.tokens.accessToken);
        console.log('- tokens.refreshToken:', !!response.data.data.tokens.refreshToken);
      }
      
      if (response.data.data.token) {
        console.log('\nToken Analysis:');
        console.log('- Token length:', response.data.data.token.length);
        console.log('- Token preview:', response.data.data.token.substring(0, 50) + '...');
        
        // Check if it's JWT format
        const parts = response.data.data.token.split('.');
        console.log('- JWT parts:', parts.length);
        if (parts.length === 3) {
          console.log('✅ Valid JWT format');
        } else {
          console.log('❌ Not JWT format - this is a base64 token');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugProductionResponse();
