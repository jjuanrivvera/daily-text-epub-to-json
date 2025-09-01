import { REFERENCE_PATTERNS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Handles reference extraction and formatting
 */
export class ReferenceFormatter {
  /**
   * Extract Watchtower reference from explanation text
   * @param {string} explanation - The explanation text containing the reference
   * @returns {string} - The extracted reference or empty string
   */
  extractReference(explanation) {
    try {
      if (!explanation) {
        return '';
      }

      const indexOfReference = explanation.search(REFERENCE_PATTERNS.WATCHTOWER);
      if (indexOfReference === -1) {
        logger.debug('No Watchtower reference found in explanation');
        return '';
      }

      return explanation.substring(indexOfReference + 1).trim();
    } catch (error) {
      logger.error('Error extracting reference', error);
      return '';
    }
  }

  /**
   * Separate scripture reference from text content
   * @param {string} textWithReference - Scripture text with reference
   * @returns {Object} - Object with text (reference) and textContent (scripture)
   */
  separateScriptureReference(textWithReference) {
    try {
      if (!textWithReference) {
        return { text: '', textContent: '' };
      }

      const indexOfParenthesis = textWithReference.search(REFERENCE_PATTERNS.SCRIPTURE_PARENTHESIS);

      if (indexOfParenthesis === -1) {
        // No parenthesis found, treat entire text as content
        return {
          text: '',
          textContent: textWithReference.trim(),
        };
      }

      const reference = textWithReference.substring(indexOfParenthesis).trim();
      const content = textWithReference.substring(0, indexOfParenthesis).trim();

      return {
        text: reference,
        textContent: content ? `${content}.` : '',
      };
    } catch (error) {
      logger.error('Error separating scripture reference', error);
      return { text: '', textContent: textWithReference || '' };
    }
  }
}
