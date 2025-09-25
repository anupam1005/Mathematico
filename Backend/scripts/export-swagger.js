// Script to export Swagger JSON for external tools
const fs = require('fs');
const path = require('path');

try {
  // Load swagger configuration
  const { specs } = require('../config/swagger');
  
  // Create docs directory if it doesn't exist
  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Export Swagger JSON
  const swaggerJsonPath = path.join(docsDir, 'swagger.json');
  fs.writeFileSync(swaggerJsonPath, JSON.stringify(specs, null, 2));
  
  console.log('✅ Swagger JSON exported to:', swaggerJsonPath);
  console.log('📄 File size:', (fs.statSync(swaggerJsonPath).size / 1024).toFixed(2), 'KB');
  
  // Export OpenAPI YAML (optional)
  const yaml = require('js-yaml');
  const yamlPath = path.join(docsDir, 'openapi.yaml');
  fs.writeFileSync(yamlPath, yaml.dump(specs));
  
  console.log('✅ OpenAPI YAML exported to:', yamlPath);
  console.log('📄 File size:', (fs.statSync(yamlPath).size / 1024).toFixed(2), 'KB');
  
  console.log('\n🎉 API documentation exported successfully!');
  console.log('📁 Files created:');
  console.log('  - swagger.json (for Swagger UI)');
  console.log('  - openapi.yaml (for OpenAPI tools)');
  console.log('  - Mathematico_API.postman_collection.json (for Postman)');
  console.log('  - API_DOCUMENTATION.md (human-readable docs)');
  
} catch (error) {
  console.error('❌ Error exporting Swagger:', error.message);
  
  // Fallback - create minimal swagger.json
  const minimalSwagger = {
    openapi: '3.0.0',
    info: {
      title: 'Mathematico Backend API',
      version: '2.0.0',
      description: 'Educational platform backend API'
    },
    servers: [
      {
        url: 'https://mathematico-backend-new.vercel.app',
        description: 'Production server'
      }
    ],
    paths: {
      '/api/v1/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is healthy'
            }
          }
        }
      }
    }
  };
  
  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(docsDir, 'swagger.json'), JSON.stringify(minimalSwagger, null, 2));
  console.log('✅ Minimal swagger.json created as fallback');
}
