**
 * PDF Configuration Validator
 * Run this script to validate PDF viewer configuration before production build
 * 
 * Usage: node validate-pdf-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating PDF Viewer Configuration...\n');

let errors = [];
let warnings = [];
let passed = [];

// Check 1: SecurePdfViewer component exists
const securePdfViewerPath = path.join(__dirname, 'src/components/SecurePdfViewer.tsx');
if (fs.existsSync(securePdfViewerPath)) {
  const content = fs.readFileSync(securePdfViewerPath, 'utf8');
  
  // Check for authentication
  if (content.includes('Authorization') && content.includes('Bearer')) {
    passed.push('✅ Authentication headers are included in PDF requests');
  } else {
    errors.push('❌ Authentication headers missing in SecurePdfViewer');
  }
  
  // Check for HTTPS
  if (content.includes('https://') || content.includes('cloudinary.com')) {
    passed.push('✅ HTTPS/Cloudinary URLs are handled');
  } else {
    warnings.push('⚠️  HTTPS URL handling may be missing');
  }
  
  // Check for error handling
  if (content.includes('onError') || content.includes('onHttpError') || content.includes('renderError')) {
    passed.push('✅ Error handling is implemented');
  } else {
    warnings.push('⚠️  Error handling may be incomplete');
  }
  
  // Check for WebView configuration
  if (content.includes('domStorageEnabled') && content.includes('javaScriptEnabled')) {
    passed.push('✅ WebView is properly configured');
  } else {
    warnings.push('⚠️  WebView configuration may be incomplete');
  }
  
  // Check for HTML template
  if (content.includes('securePdfHtml') && content.includes('iframe')) {
    passed.push('✅ PDF HTML template is present');
  } else {
    errors.push('❌ PDF HTML template is missing');
  }
} else {
  errors.push('❌ SecurePdfViewer.tsx file not found');
}

// Check 2: pdfService exists
const pdfServicePath = path.join(__dirname, 'src/services/pdfService.ts');
if (fs.existsSync(pdfServicePath)) {
  const content = fs.readFileSync(pdfServicePath, 'utf8');
  
  // Check for authentication
  if (content.includes('Authorization') && content.includes('Bearer')) {
    passed.push('✅ pdfService includes authentication');
  } else {
    errors.push('❌ Authentication missing in pdfService');
  }
  
  // Check for error handling
  if (content.includes('errorHandler') || content.includes('catch')) {
    passed.push('✅ pdfService has error handling');
  } else {
    warnings.push('⚠️  Error handling may be missing in pdfService');
  }
} else {
  errors.push('❌ pdfService.ts file not found');
}

// Check 3: Config file
const configPath = path.join(__dirname, 'src/config.ts');
if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, 'utf8');
  
  // Check for production URL
  if (content.includes('mathematico-backend-new.vercel.app') || content.includes('PROD_BACKEND')) {
    passed.push('✅ Production backend URL is configured');
  } else {
    warnings.push('⚠️  Production backend URL may not be set');
  }
  
  // Check for HTTPS
  if (content.includes('https://')) {
    passed.push('✅ HTTPS is configured');
  } else {
    warnings.push('⚠️  HTTPS may not be enforced');
  }
} else {
  errors.push('❌ config.ts file not found');
}

// Check 4: useSecurePdf hook
const hookPath = path.join(__dirname, 'src/hooks/useSecurePdf.ts');
if (fs.existsSync(hookPath)) {
  passed.push('✅ useSecurePdf hook exists');
} else {
  warnings.push('⚠️  useSecurePdf hook not found (may use direct service calls)');
}

// Check 5: SecurePdfScreen
const screenPath = path.join(__dirname, 'src/screens/SecurePdfScreen.tsx');
if (fs.existsSync(screenPath)) {
  passed.push('✅ SecurePdfScreen exists');
  
  const content = fs.readFileSync(screenPath, 'utf8');
  if (content.includes('SecurePdfViewer')) {
    passed.push('✅ SecurePdfScreen uses SecurePdfViewer component');
  } else {
    errors.push('❌ SecurePdfScreen does not use SecurePdfViewer');
  }
} else {
  errors.push('❌ SecurePdfScreen.tsx file not found');
}

// Check 6: Package.json dependencies
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (deps['react-native-webview']) {
    passed.push('✅ react-native-webview is installed');
  } else {
    errors.push('❌ react-native-webview is not installed');
  }
  
  if (deps['expo-secure-store'] || deps['@react-native-async-storage/async-storage']) {
    passed.push('✅ Storage library is installed');
  } else {
    warnings.push('⚠️  Storage library may be missing');
  }
} else {
  errors.push('❌ package.json not found');
}

// Print results
console.log('📊 Validation Results:\n');

if (passed.length > 0) {
  console.log('✅ Passed Checks:');
  passed.forEach(check => console.log(`   ${check}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(error => console.log(`   ${error}`));
  console.log('');
  console.log('❌ Validation FAILED. Please fix the errors above before building for production.\n');
  process.exit(1);
} else {
  console.log('✅ All critical checks passed!\n');
  
  if (warnings.length > 0) {
    console.log('⚠️  Please review the warnings above.\n');
  }
  
  console.log('✅ PDF Viewer configuration is ready for production!\n');
  process.exit(0);
}

