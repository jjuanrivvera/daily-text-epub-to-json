import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

/**
 * Handles EPUB file extraction
 */
export class EpubExtractor {
  constructor(year) {
    this.year = year;
    this.shortYear = year.slice(-2);
    this.epubFilename = `es${this.shortYear}_S.zip`;
  }

  /**
   * Extract EPUB file to Lab directory
   * @returns {Promise<boolean>} - True if extraction successful
   */
  async extract() {
    try {
      const epubPath = path.join(process.cwd(), 'Epubs', this.epubFilename);

      // Check if EPUB file exists
      try {
        await fs.access(epubPath);
      } catch {
        throw new Error(`EPUB file not found: ${epubPath}`);
      }

      logger.info(`Extracting EPUB for year ${this.year}: ${this.epubFilename}`);

      // Clean Lab directory
      await this.cleanLabDirectory();

      // Create Lab directory
      await fs.mkdir('Lab', { recursive: true });

      // Extract using unzip.js
      await this.runExtraction(epubPath);

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
