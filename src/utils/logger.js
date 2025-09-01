/**
 * Simple logger utility
 */

export class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message) {
    console.log(`[INFO] ${message}`);
  }

  error(message, error = null) {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error(error.message || error);
      if (this.verbose && error.stack) {
        console.error(error.stack);
      }
    }
  }

  warn(message) {
    console.warn(`[WARN] ${message}`);
  }

  debug(message) {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  success(message) {
    console.log(`[SUCCESS] ✓ ${message}`);
  }
}

// Create singleton logger instance - will check config on first import
let instance = null;

export default (() => {
  if (!instance) {
    // Check if verbose mode is enabled
    const verbose = process.env.VERBOSE === 'true';
    instance = new Logger(verbose);
  }
  return instance;
})();
