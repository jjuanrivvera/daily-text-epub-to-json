#!/usr/bin/env node
import { EpubExtractor } from './extractor/EpubExtractor.js';
import { FileProcessor } from './parser/FileProcessor.js';
import config from './config/index.js';
import logger from './utils/logger.js';

/**
 * Main application entry point
 */
class DailyTextProcessor {
  constructor(epubPath = null, year = null) {
    // Use provided parameters or fall back to config
    // Only use config year if no epubPath is provided (legacy mode)
    this.year = year || (!epubPath ? config.getYear() : null);
    this.epubPath = epubPath;
    
    // Initialize extractor with flexible parameters
    this.extractor = new EpubExtractor(this.year, this.epubPath);
    
    // Processor will be initialized after year is determined
    this.processor = null;
  }

  /**
   * Run the complete extraction and processing pipeline
   */
  async run() {
    try {
      logger.info('Starting Daily Text EPUB to JSON processor');
      
      // Show initial year (may be null for auto-detection)
      if (this.year) {
        logger.info(`Processing year: ${this.year}`);
      } else {
        logger.info('Year will be auto-detected from EPUB content');
      }

      // Step 1: Extract EPUB (this may auto-detect the year)
      logger.info('Step 1: Extracting EPUB file...');
      await this.extractor.extract();
      
      // Update year from extraction if it was auto-detected
      if (!this.year && this.extractor.year) {
        this.year = this.extractor.year;
        logger.info(`Using detected year: ${this.year}`);
      }
      
      // Initialize processor now that we have the year
      if (!this.processor) {
        this.processor = new FileProcessor(this.year);
      }

      // Step 2: Process files
      logger.info('Step 2: Processing XHTML files...');
      const dailyTexts = await this.processor.processFiles();

      // Step 3: Save to JSON
      logger.info('Step 3: Saving to JSON...');
      await this.processor.saveToJson(dailyTexts);

      // Step 4: Save to MongoDB (if configured)
      if (config.getMongoDsn()) {
        logger.info('Step 4: Saving to MongoDB...');
        await this.saveToMongoDB(dailyTexts);
      }

      logger.success(`✨ Processing complete! Generated ${dailyTexts.length} daily texts.`);
    } catch (error) {
      logger.error('Processing failed', error);
      process.exit(1);
    }
  }

  /**
   * Save daily texts to MongoDB
   * @param {Array} dailyTexts - Array of daily text objects
   */
  async saveToMongoDB(dailyTexts) {
    try {
      const mongoose = await import('mongoose');

      mongoose.connect(config.getMongoDsn(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      logger.info('Connected to MongoDB');

      // Define schema
      const textSchema = new mongoose.Schema({
        date: String,
        text: String,
        textContent: String,
        explanation: String,
        reference: String,
      });

      const Text = mongoose.model('Text', textSchema);

      // Clear existing data for this year
      await Text.deleteMany({ date: new RegExp(`^${this.year}-`) });

      // Insert new data
      await Text.insertMany(dailyTexts);

      logger.success(`Saved ${dailyTexts.length} texts to MongoDB`);

      await mongoose.disconnect();
    } catch (error) {
      logger.error('MongoDB save failed', error);
      logger.warn('Data was saved to JSON file successfully');
    }
  }

  /**
   * Extract only (no processing)
   */
  async extractOnly() {
    try {
      logger.info('Running extraction only...');
      await this.extractor.extract();
      
      // Update year from extraction if it was auto-detected
      if (!this.year && this.extractor.year) {
        this.year = this.extractor.year;
        logger.info(`Year detected: ${this.year}`);
      }
      
      logger.success('Extraction complete!');
    } catch (error) {
      logger.error('Extraction failed', error);
      process.exit(1);
    }
  }

  /**
   * Process only (assumes extraction was done)
   */
  async processOnly() {
    try {
      logger.info('Running processing only...');
      
      // Initialize processor if not already done (year should be known by now)
      if (!this.processor) {
        if (!this.year) {
          throw new Error('Year must be specified for process-only mode');
        }
        this.processor = new FileProcessor(this.year);
      }
      
      const dailyTexts = await this.processor.processFiles();
      await this.processor.saveToJson(dailyTexts);

      if (config.getMongoDsn()) {
        await this.saveToMongoDB(dailyTexts);
      }

      logger.success(`Processing complete! Generated ${dailyTexts.length} daily texts.`);
    } catch (error) {
      logger.error('Processing failed', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const processor = new DailyTextProcessor();

  // Check command line arguments
  const command = process.argv[2];

  switch (command) {
    case 'extract':
      await processor.extractOnly();
      break;
    case 'process':
      await processor.processOnly();
      break;
    case 'build':
    default:
      await processor.run();
      break;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error', error);
    process.exit(1);
  });
}

export { DailyTextProcessor };
