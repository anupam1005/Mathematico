const Settings = require('../models/Settings');
const { verifyAccessToken } = require('../utils/jwt');

// In-memory cache for settings
let cachedSettings = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache for performance

/**
 * Middleware to check for maintenance mode
 * If maintenance mode is ON, only admins can access the API
 */
const maintenanceMode = async (req, res, next) => {
  try {
    const now = Date.now();
    let settings = cachedSettings;

    // Update cache if expired or missing
    if (!settings || now - lastCacheUpdate > CACHE_TTL) {
      settings = await Settings.findOne({});
      cachedSettings = settings;
      lastCacheUpdate = now;
    }
    
    // If no settings found or maintenance mode is OFF, continue
    if (!settings || !settings.maintenance_mode) {
      return next();
    }
    
    // If maintenance mode is ON, check if user is already authenticated as admin
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // If not already authenticated, try to see if they HAVE an admin token in headers
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        if (decoded && decoded.role === 'admin') {
          return next();
        }
      } catch (e) {
        // Token invalid or expired, proceed to block
      }
    }
    
    // Otherwise, return 503 Service Unavailable
    return res.status(503).json({
      success: false,
      message: 'System is currently under maintenance. Please try again later.',
      maintenance: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // If error checking settings, default to allowing request
    next();
  }
};

/**
 * Clear the settings cache manually (e.g. after an update)
 */
const clearSettingsCache = () => {
  cachedSettings = null;
  lastCacheUpdate = 0;
};

module.exports = { maintenanceMode, clearSettingsCache };
