// Production Monitoring Utilities
const os = require('os');
const fs = require('fs');
const path = require('path');

class MonitoringService {
  static getSystemHealth() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage(),
        total: os.totalmem(),
        free: os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      platform: os.platform(),
      nodeVersion: process.version
    };
  }

  static async getDatabaseHealth() {
    try {
      const mongoose = require('mongoose');
      const state = mongoose.connection.readyState;
      
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        status: states[state] || 'unknown',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static logError(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      context,
      system: this.getSystemHealth()
    };

    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'errors.json');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  static async checkDependencies() {
    const checks = {
      database: await this.getDatabaseHealth(),
      filesystem: this.checkFilesystem(),
      memory: this.checkMemory(),
      disk: this.checkDiskSpace()
    };

    const healthy = Object.values(checks).every(check => 
      check.status === 'healthy' || check.status === 'connected'
    );

    return {
      overall: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  static checkFilesystem() {
    try {
      const testFile = path.join(__dirname, '../logs/test.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return { status: 'healthy', message: 'Filesystem writable' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  static checkMemory() {
    const memory = process.memoryUsage();
    const threshold = 500 * 1024 * 1024; // 500MB threshold
    
    return {
      status: memory.heapUsed < threshold ? 'healthy' : 'warning',
      usage: memory,
      threshold
    };
  }

  static checkDiskSpace() {
    try {
      const stats = fs.statSync(__dirname);
      return { status: 'healthy', message: 'Disk accessible' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = MonitoringService;
