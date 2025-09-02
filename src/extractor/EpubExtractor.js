import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';
import { YearDetector } from '../utils/YearDetector.js';

/**
 * Handles EPUB file extraction with automatic year detection
 */
export class EpubExtractor {
  constructor(year = null, epubPath = null) {
    this.year = year;
    this.epubPath = epubPath;
    this.shortYear = year ? String(year).slice(-2) : null;
    this.epubFilename = year ? `es${this.shortYear}_S.zip` : null;
  }

  /**
   * Extract EPUB file to Lab directory
   * @returns {Promise<boolean>} - True if extraction successful
   */
  async extract() {
    try {
      // Auto-detect year and determine file path
      let actualEpubPath;
      
      if (this.epubPath) {
        // Explicit EPUB path provided
        actualEpubPath = this.epubPath;
        
        // Auto-detect year if not provided
        if (!this.year) {
          logger.info('Auto-detecting year from EPUB content...');
          this.year = await YearDetector.detectYear(actualEpubPath);
          this.shortYear = this.year.slice(-2);
          this.epubFilename = path.basename(actualEpubPath);
          logger.success(`Year detected: ${this.year}`);
        }
      } else if (this.year) {
        // Legacy mode: construct path from year
        actualEpubPath = path.join(process.cwd(), 'Epubs', this.epubFilename);
      } else {
        throw new Error('Either year or epubPath must be provided');
      }

      // Verify file exists
      try {
        await fs.access(actualEpubPath);
      } catch {
        throw new Error(`EPUB file not found: ${actualEpubPath}`);
      }

      logger.info(`Extracting EPUB for year ${this.year}: ${path.basename(actualEpubPath)}`);

      // Clean Lab directory
      await this.cleanLabDirectory();

      // Create Lab directory
      await fs.mkdir('Lab', { recursive: true });

      // Extract using unzip.js
      await this.runExtraction(actualEpubPath);

      logger.success('Extraction completed successfully!');
      return true;
    } catch (error) {
      logger.error('Extraction failed', error);
      throw error;
    }
  }

  /**
   * Clean the Lab directory
   * @returns {Promise<void>}
   */
  async cleanLabDirectory() {
    try {
      await fs.access('Lab');
      logger.info('Cleaning existing Lab directory...');
      await fs.rm('Lab', { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, that's fine
    }
  }

  /**
   * Run the extraction process
   * @param {string} epubPath - Path to EPUB file
   * @returns {Promise<void>}
   */
  runExtraction(epubPath) {
    return new Promise((resolve, reject) => {
      const unzipPath = path.join(process.cwd(), 'unzip.cjs');
      const unzipProcess = spawn('node', [unzipPath, epubPath], {
        cwd: path.join(process.cwd(), 'Lab'),
        stdio: 'pipe',
      });

      let errorOutput = '';

      unzipProcess.stdout.on('data', (data) => {
        // Show progress for large files
        if (data.toString().includes('%')) {
          process.stdout.write(`\r${data.toString().trim()}`);
        }
      });

      unzipProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      unzipProcess.on('close', (code) => {
        process.stdout.write('\n'); // New line after progress

        if (code !== 0) {
          reject(new Error(`Extraction failed with code ${code}: ${errorOutput}`));
        } else {
          resolve();
        }
      });

      unzipProcess.on('error', (err) => {
        reject(new Error(`Failed to start extraction process: ${err.message}`));
      });
    });
  }
}
