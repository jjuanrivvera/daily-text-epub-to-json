#!/usr/bin/env node
import { Command } from 'commander';
import { DailyTextProcessor } from './index.js';
import logger from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, extname } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CLI for Daily Text EPUB to JSON converter
 * Provides command-line interface for processing EPUB files
 */
class DailyTextCLI {
  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  /**
   * Setup the Commander.js program configuration
   */
  setupProgram() {
    const packageJson = this.getPackageInfo();

    this.program
      .name('daily-text-epub-to-json')
      .description('Convert JW daily text EPUBs to JSON format')
      .version(packageJson.version)
      .argument('<epub>', 'Path to the EPUB file to process')
      .option('-y, --year <year>', 'Override year detection (e.g., 2025)')
      .option('-o, --output <path>', 'Custom output path for JSON file')
      .option('-m, --mongo', 'Enable MongoDB saving')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('--extract-only', 'Only extract EPUB, do not process')
      .option('--process-only', 'Only process extracted files (assumes extraction done)')
      .helpOption('-h, --help', 'Display help for command')
      .addHelpText(
        'after',
        `
Examples:
  $ npx daily-text-epub-to-json es25_S.epub
  $ daily-text-epub-to-json es25_S.epub --year 2025 --verbose
  $ daily-text-epub-to-json es25_S.epub --output ./custom-output.json
  $ daily-text-epub-to-json es25_S.epub --mongo --verbose
      `
      );

    this.program.action((epubPath, options) => {
      this.handleCommand(epubPath, options);
    });
  }

  /**
   * Get package information
   */
  getPackageInfo() {
    try {
      const packagePath = join(__dirname, '..', 'package.json');
      const packageContent = readFileSync(packagePath, 'utf8');
      return JSON.parse(packageContent);
    } catch {
      return { version: '1.0.0' }; // Fallback version
    }
  }

  /**
   * Handle the main command execution
   */
  async handleCommand(epubPath, options) {
    try {
      // Setup verbose logging if requested
      if (options.verbose) {
        process.env.LOG_LEVEL = 'debug';
        logger.info('Verbose logging enabled');
      }

      // Validate EPUB file path
      const resolvedEpubPath = resolve(epubPath);
      if (!existsSync(resolvedEpubPath)) {
        logger.error(`EPUB file not found: ${resolvedEpubPath}`);
        process.exit(1);
      }

      // Validate file extension
      const fileExt = extname(resolvedEpubPath).toLowerCase();
      if (!['.epub', '.zip'].includes(fileExt)) {
        logger.warn(`Warning: File extension '${fileExt}' is not .epub or .zip`);
        logger.info('Proceeding anyway - file may still be processable');
      }

      logger.info(`Processing EPUB file: ${resolvedEpubPath}`);

      // Setup environment variables for MongoDB if requested
      if (options.mongo) {
        if (!process.env.MONGO_DSN) {
          logger.error('MongoDB option specified but MONGO_DSN environment variable not set');
          logger.info('Please set MONGO_DSN in your .env file or environment');
          process.exit(1);
        }
        logger.info('MongoDB saving enabled');
      }

      // Setup custom output path if specified
      if (options.output) {
        process.env.OUTPUT_JSON_PATH = resolve(options.output);
        logger.info(`Custom output path: ${process.env.OUTPUT_JSON_PATH}`);
      }

      // Override year if specified
      let yearOverride = null;
      if (options.year) {
        yearOverride = this.validateYear(options.year);
        logger.info(`Year override: ${yearOverride}`);
      } else {
        // Clear the YEAR environment variable to enable auto-detection
        const originalYear = process.env.YEAR;
        delete process.env.YEAR;
        if (originalYear) {
          logger.info('Cleared configured year to enable auto-detection from EPUB content');
        } else {
          logger.info('Year will be auto-detected from EPUB content');
        }
      }

      // Create processor instance
      const processor = new DailyTextProcessor(resolvedEpubPath, yearOverride);

      // Execute based on mode
      if (options.extractOnly && options.processOnly) {
        logger.error('Cannot specify both --extract-only and --process-only');
        process.exit(1);
      }

      if (options.extractOnly) {
        logger.info('Running in extract-only mode');
        await processor.extractOnly();
      } else if (options.processOnly) {
        logger.info('Running in process-only mode');
        if (!yearOverride) {
          logger.error('--year must be specified when using --process-only mode');
          process.exit(1);
        }
        await processor.processOnly();
      } else {
        logger.info('Running full processing pipeline');
        await processor.run();
      }

      logger.success('CLI execution completed successfully!');
    } catch (error) {
      logger.error('CLI execution failed', error);

      if (options.verbose) {
        console.error('\nFull error stack:');
        console.error(error);
      }

      process.exit(1);
    }
  }

  /**
   * Validate year parameter
   */
  validateYear(yearStr) {
    const year = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();

    if (isNaN(year)) {
      logger.error(`Invalid year: ${yearStr}. Year must be a number.`);
      process.exit(1);
    }

    if (year < 1990 || year > currentYear + 10) {
      logger.error(`Invalid year: ${year}. Year must be between 1990 and ${currentYear + 10}.`);
      process.exit(1);
    }

    return year;
  }

  /**
   * Parse and execute CLI commands
   */
  async run() {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      logger.error('CLI parsing failed', error);
      process.exit(1);
    }
  }
}

// Create and run CLI if this file is executed directly
async function main() {
  const cli = new DailyTextCLI();
  await cli.run();
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal CLI error:', error);
    process.exit(1);
  });
}

export { DailyTextCLI };
