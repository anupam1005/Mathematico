// Test Vercel configuration
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Vercel configuration...');

try {
  // Read vercel.json
  const vercelConfigPath = path.join(__dirname, 'vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  
  console.log('✅ vercel.json loaded successfully');
  
  // Check required properties
  const requiredProps = ['version', 'functions', 'routes', 'env'];
  const missingProps = requiredProps.filter(prop => !vercelConfig[prop]);
  
  if (missingProps.length > 0) {
    console.log(`❌ Missing required properties: ${missingProps.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ All required properties present');
  
  // Check functions
  if (!vercelConfig.functions['api/index.js']) {
    console.log('❌ Missing api/index.js function');
    process.exit(1);
  }
  
  if (!vercelConfig.functions['api/favicon.js']) {
    console.log('❌ Missing api/favicon.js function');
    process.exit(1);
  }
  
  console.log('✅ All required functions present');
  
  // Check routes
  const faviconRoutes = vercelConfig.routes.filter(route => 
    route.src.includes('favicon')
  );
  
  if (faviconRoutes.length < 3) {
    console.log('❌ Insufficient favicon routes');
    process.exit(1);
  }
  
  console.log('✅ Favicon routes configured correctly');
  
  // Check environment variables
  const requiredEnvVars = ['NODE_ENV', 'VERCEL', 'DB_HOST', 'DB_PORT'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !vercelConfig.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.log(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ All required environment variables present');
  
  console.log('🎉 Vercel configuration is valid!');
  
} catch (error) {
  console.error('❌ Vercel configuration test failed:', error.message);
  process.exit(1);
}
