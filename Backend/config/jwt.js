/**
 * JWT CONFIG SHIM (SERVERLESS-SAFE)
 *
 * Why this exists:
 * - `Backend/index.js` performs a startup-time "configuration-only" validation via `require('./config/jwt')`.
 * - The actual JWT implementation lives in `Backend/utils/jwt.js`.
 * - Some deployments/logs were failing with "Cannot find module './config/jwt'".
 *
 * This file intentionally does NOT change any business logic or token behavior.
 * It only provides the expected module entrypoint.
 */

'use strict';

const { validateJwtConfig } = require('../utils/jwt');

module.exports = {
  validateJwtConfig
};

