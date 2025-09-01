import dotenv from 'dotenv';
import logger from '../utils/logger.js';

/**
 * Configuration management
 */
export class Config {
  constructor() {
    // Load environment variables
    dotenv.config();

    this.year = process.env.YEAR;
    this.mongoDsn = process.env.MONGO_DSN;
    this.verbose = process.env.VERBOSE === 'true';

    // Validate required config
    this.validate();
  }

  validate() {
    if (!this.year) {
      throw new Error('YEAR environment variable is required in .env file');
    }

    if (!/^\d{4}$/.test(this.year)) {
      throw new Error('YEAR must be a 4-digit year (e.g., 2025)');
    }

    logger.info(`Configuration loaded for year ${this.year}`);

    if (this.mongoDsn) {
      logger.info('MongoDB connection string found');
    } else {
      logger.info('No MongoDB connection - will save to JSON only');
    }
  }

  getYear() {
    return this.year;
  }

  getMongoDsn() {
    return this.mongoDsn;
  }

  isVerbose() {
    return this.verbose;
  }
}

export default new Config();
