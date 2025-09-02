import fs from 'fs/promises';
import path from 'path';
import { TextParser } from './TextParser.js';
import { FILE_PATTERNS, FILES_TO_SKIP } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Processes XHTML files and converts them to JSON
 */
export class FileProcessor {
  constructor(year) {
    this.year = year;
    this.textParser = new TextParser(year);
  }

  /**
   * Process all XHTML files in the Lab/OEBPS directory
   * @returns {Promise<Array>} - Array of parsed daily texts
   */
  async processFiles() {
    try {
      const oebpsPath = path.join(process.cwd(), 'Lab', 'OEBPS');

      // Check if directory exists
      try {
        await fs.access(oebpsPath);
      } catch {
        throw new Error(`OEBPS directory not found. Please run extraction first.`);
      }

      // Read all files
      const files = await fs.readdir(oebpsPath);

      // Filter XHTML files
      const xhtmlFiles = files.filter((file) => this.shouldProcessFile(file));

      logger.info(`Found ${xhtmlFiles.length} XHTML files to process`);
      if (xhtmlFiles.length === 0) {
        logger.debug(`Total files in directory: ${files.length}`);
        logger.debug(`Sample files: ${files.slice(0, 5).join(', ')}`);
      }

      // Process files in parallel
      const results = await Promise.all(
        xhtmlFiles.map((file) => this.processFile(path.join(oebpsPath, file), file))
      );

      // Filter out null results
      const validTexts = results.filter((text) => text !== null);

      // Sort by date (YYYY-MM-DD format sorts correctly as strings)
      validTexts.sort((a, b) => a.date.localeCompare(b.date));

      logger.success(`Successfully processed ${validTexts.length} daily texts`);

      return validTexts;
    } catch (error) {
      logger.error('Error processing files', error);
      throw error;
    }
  }

  /**
   * Check if a file should be processed
   * @param {string} filename - Name of the file
   * @returns {boolean} - True if file should be processed
   */
  shouldProcessFile(filename) {
    // Must be XHTML file
    if (!FILE_PATTERNS.XHTML.test(filename)) {
      return false;
    }

    // Skip extracted files
    if (FILE_PATTERNS.EXTRACTED.test(filename)) {
      return false;
    }

    // Skip specific files
    if (FILES_TO_SKIP.some((skip) => filename.includes(skip))) {
      return false;
    }

    // Don't skip any numbered files - they may contain daily texts too

    return true;
  }

  /**
   * Process a single file
   * @param {string} filePath - Full path to the file
   * @param {string} filename - Name of the file (for logging)
   * @returns {Promise<Object|null>} - Parsed text object or null
   */
  async processFile(filePath, filename) {
    try {
      logger.debug(`Processing: ${filename}`);

      const content = await fs.readFile(filePath, 'utf8');
      const parsedText = this.textParser.parse(content);

      if (!parsedText) {
        logger.debug(`Skipped ${filename} - could not parse as daily text`);
      }

      return parsedText;
    } catch (error) {
      logger.error(`Error processing file ${filename}`, error);
      return null;
    }
  }

  /**
   * Save results to JSON file
   * @param {Array} data - Array of daily texts
   * @param {string} outputPath - Path for output file
   * @returns {Promise<void>}
   */
  async saveToJson(data, outputPath = 'output.json') {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      await fs.writeFile(outputPath, jsonContent, 'utf8');
      logger.success(`Saved ${data.length} entries to ${outputPath}`);
    } catch (error) {
      logger.error(`Error saving to JSON file`, error);
      throw error;
    }
  }
}
