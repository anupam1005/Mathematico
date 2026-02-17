const fs = require('fs');
const path = require('path');

/**
 * Export generated swagger specs to Backend/docs/swagger.json
 * This keeps docs in sync with runtime routes (minimizes drift).
 */
async function main() {
  const outFile = path.join(__dirname, '..', 'docs', 'swagger.json');
  const outDir = path.dirname(outFile);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Load generated specs
  // Note: config/swagger exports { specs }, produced by swagger-jsdoc.
  // This script intentionally does not start the server.
  // eslint-disable-next-line global-require
  const { specs } = require('../config/swagger');

  fs.writeFileSync(outFile, JSON.stringify(specs, null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`✅ Swagger exported to ${outFile}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to export swagger:', err);
  process.exitCode = 1;
});

