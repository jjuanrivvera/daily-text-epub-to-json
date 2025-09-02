import { SPANISH_MONTHS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Handles date formatting from Spanish text to ISO format
 */
export class DateFormatter {
  constructor(year) {
    this.year = year;
  }

  /**
   * Format date from Spanish text to YYYY-MM-DD
   * @param {string} dateText - Spanish date text (e.g., "Domingo 10 de enero")
   * @returns {string|null} - Formatted date (YYYY-MM-DD) or null if parsing fails
   */
  format(dateText) {
    try {
      if (!dateText) {
        logger.warn('No date text provided');
        return null;
      }

      // Extract day number - only the first number occurrence
      const dayMatch = dateText.match(/\d+/);
      if (!dayMatch) {
        logger.warn(`No day number found in: ${dateText}`);
        return null;
      }

      let day = dayMatch[0];
      if (day.length === 1) {
        day = `0${day}`;
      }

      // Extract month name (last word)
      const monthName = dateText.slice(dateText.lastIndexOf(' ') + 1).toLowerCase();
      const month = SPANISH_MONTHS[monthName];

      if (!month) {
        logger.warn(`Unknown month: ${monthName} in date: ${dateText}`);
        return null;
      }

      return `${this.year}-${month}-${day}`;
    } catch (error) {
      logger.error(`Error formatting date: ${dateText}`, error);
      return null;
    }
  }
}
