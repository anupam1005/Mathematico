#!/usr/bin/env node

/**
 * 🚀 Mathematico Backend Environment Setup
 * This script helps you set up environment variables for serverless deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 Mathematico Backend Environment Setup');
  console.log('==========================================\n');

  console.log('This script will help you set up environment variables for serverless deployment.\n');

  // Check if config.env exists
  const configPath = path.join(__dirname, 'Backend', 'config.env');
  if (!fs.existsSync(configPath)) {
    console.log('❌ config.env not found. Please create it first.');
    process.exit(1);
  }

  console.log('📋 Required Environment Variables for Serverless Deployment:\n');

  const requiredVars = [
    {
      name: 'MONGODB_URI',
      description: 'MongoDB Atlas connection string',
      example: 'mongodb+srv://username:password@cluster.mongodb.net/database'
    },
    {
      name: 'JWT_SECRET',
      description: 'JWT secret key (at least 64 characters)',
      example: 'your-super-secret-jwt-key-here-make-it-at-least-64-characters-long'
    },
    {
      name: 'JWT_REFRESH_SECRET',
      description: 'JWT refresh secret key (at least 64 characters)',
      example: 'your-super-secret-refresh-jwt-key-here-make-it-at-least-64-characters-long'
    },
    {
      name: 'CLOUDINARY_CLOUD_NAME',
      description: 'Cloudinary cloud name',
      example: 'your-cloudinary-cloud-name'
    },
    {
      name: 'CLOUDINARY_API_KEY',
      description: 'Cloudinary API key',
      example: 'your-cloudinary-api-key'
    },
    {
      name: 'CLOUDINARY_API_SECRET',
      description: 'Cloudinary API secret',
      example: 'your-cloudinary-api-secret'
    },
    {
      name: 'ADMIN_EMAIL',
      description: 'Admin email address',
      example: 'admin@mathematico.com'
    },
    {
      name: 'ADMIN_PASSWORD',
      description: 'Admin password (at least 8 characters)',
      example: 'your-secure-admin-password'
    }
  ];

  console.log('📝 Environment Variables Checklist:\n');
  
  requiredVars.forEach((variable, index) => {
    console.log(`${index + 1}. ${variable.name}`);
    console.log(`   Description: ${variable.description}`);
    console.log(`   Example: ${variable.example}\n`);
  });

  console.log('🔧 Next Steps:\n');
  console.log('1. Set these variables in your Vercel dashboard:');
  console.log('   - Go to your Vercel project dashboard');
  console.log('   - Navigate to Settings > Environment Variables');
  console.log('   - Add each variable with its value\n');

  console.log('2. For local development, update Backend/config.env with your values\n');

  console.log('3. Deploy your backend:');
  console.log('   - Run: vercel (for preview)');
  console.log('   - Run: vercel --prod (for production)\n');

  console.log('4. Test your deployment:');
  console.log('   - Health check: https://your-domain.vercel.app/health');
  console.log('   - API root: https://your-domain.vercel.app/api/v1\n');

  const continueSetup = await question('Do you want to continue with deployment? (y/n): ');
  
  if (continueSetup.toLowerCase() === 'y') {
    console.log('\n🚀 Starting deployment...');
    console.log('Run: vercel --prod');
  } else {
    console.log('\n📋 Please set up your environment variables first, then run:');
    console.log('   vercel --prod');
  }

  rl.close();
}

setupEnvironment().catch(console.error);
