import sanitizeHtml from 'sanitize-html';
import { DateFormatter } from '../formatter/DateFormatter.js';
import { ReferenceFormatter } from '../formatter/ReferenceFormatter.js';
import { SPANISH_MONTHS } from '../utils/constants.js';
import logger from '../utils/logger.js';

/**
 * Parses XHTML content and extracts daily text data
 */
export class TextParser {
  constructor(year) {
    this.year = year;
    this.dateFormatter = new DateFormatter(year);
    this.referenceFormatter = new ReferenceFormatter();
  }

  /**
   * Parse XHTML content and extract daily text data
   * @param {string} content - Raw XHTML content
   * @returns {Object|null} - Parsed daily text object or null if parsing fails
   */
  parse(content) {
    try {
      // Method 1: Try parsing HTML structure first
      const htmlResult = this.parseHtmlStructure(content);
      if (htmlResult) {
        return htmlResult;
      }

      // Method 2: Fall back to old sanitize-and-split method
      return this.parseSanitizedText(content);
    } catch (error) {
      logger.error('Error parsing text content', error);
      return null;
    }
  }

  /**
   * Parse content using HTML structure
   * @param {string} content - Raw XHTML content
   * @returns {Object|null} - Parsed daily text object or null
   */
  parseHtmlStructure(content) {
    try {
      // Extract the date from h2 tag (handle special Memorial format)
      const dateMatch = content.match(/<h2[^>]*>(.*?)<\/h2>/s);
      if (!dateMatch) {
        return null;
      }

      let dateText = dateMatch[1];
      
      // Remove page number spans and other span tags
      dateText = dateText.replace(/<span[^>]*>.*?<\/span>/gs, '').trim();

      // Check if this is the Memorial (Conmemoración)
      if (dateText.includes('CONMEMORACIÓN')) {
        // Extract just the date part (e.g., "Sábado 12 de abril")
        const memorialDateMatch = dateText.match(
          /(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d+\s+de\s+\w+/i
        );
        if (memorialDateMatch) {
          dateText = memorialDateMatch[0];
        }
      }

      // Clean up any remaining HTML tags
      dateText = dateText.replace(/<br\s*\/?>/gi, ' ').trim();

      // Extract scripture from themeScrp paragraph
      const scriptureMatch = content.match(/<p[^>]*class="themeScrp"[^>]*>(.+?)<\/p>/s);
      if (!scriptureMatch) {
        return null;
      }

      // Extract explanation from main text paragraph
      const explanationMatch = content.match(/<p[^>]*class="p\d+\s+sb"[^>]*>(.+?)<\/p>/s);
      if (!explanationMatch) {
        return null;
      }

      // Strip HTML from extracted content
      const scriptureRaw = sanitizeHtml(scriptureMatch[1], {
        allowedTags: [],
        allowedAttributes: {},
      }).trim();

      const explanationRaw = sanitizeHtml(explanationMatch[1], {
        allowedTags: [],
        allowedAttributes: {},
      }).trim();

      // Format date
      const formattedDate = this.dateFormatter.format(dateText);
      if (!formattedDate) {
        return null;
      }

      // Extract reference from explanation
      const reference = this.referenceFormatter.extractReference(explanationRaw);
      const cleanExplanation =
        explanationRaw && reference
          ? explanationRaw.replace(` ${reference}`, '').trim()
          : explanationRaw || '';

      // Separate scripture text and reference
      const scriptureData = this.referenceFormatter.separateScriptureReference(scriptureRaw);

      return {
        date: formattedDate,
        text: scriptureData.text,
        textContent: scriptureData.textContent,
        explanation: cleanExplanation,
        reference,
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse content using old sanitize-and-split method
   * @param {string} content - Raw XHTML content
   * @returns {Object|null} - Parsed daily text object or null
   */
  parseSanitizedText(content) {
    try {
      // Strip all HTML tags
      let text = sanitizeHtml(content, {
        allowedTags: [],
        allowedAttributes: {},
      });

      // Clean up the text (same as old code)
      text = this.cleanText(text);

      // Split by \r (carriage return) like the old code
      const lines = text.split('\r').filter((line) => line.trim());

      // Need at least 4 lines (line 0 is often duplicate, we use 1, 2, 3)
      if (lines.length < 4) {
        return null;
      }

      // Check if this is the Memorial (special case)
      let dateText, scriptureWithRef, explanation;

      if (lines[0] && lines[0].includes('CONMEMORACIÓN')) {
        // Special format for Memorial: extract date from combined first lines
        const memorialDateMatch = lines
          .join(' ')
          .match(/(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d+\s+de\s+\w+/i);
        if (memorialDateMatch) {
          dateText = memorialDateMatch[0];
          // Find the scripture and explanation lines
          const scriptureIndex = lines.findIndex(
            (line) => line.includes('(') && line.includes(')')
          );
          if (scriptureIndex >= 0) {
            scriptureWithRef = lines[scriptureIndex];
            explanation = lines[scriptureIndex + 1] || '';
          }
        }
      } else {
        // Use the standard line positions
        dateText = lines[1];
        scriptureWithRef = lines[2];
        explanation = lines[3];
      }

      if (!dateText || !scriptureWithRef) {
        return null;
      }

      // Format date
      const formattedDate = this.dateFormatter.format(dateText);
      if (!formattedDate) {
        return null;
      }

      // Extract reference from explanation
      const reference = this.referenceFormatter.extractReference(explanation);
      const cleanExplanation =
        explanation && reference
          ? explanation.replace(` ${reference}`, '').trim()
          : explanation || '';

      // Separate scripture text and reference
      const scriptureData = this.referenceFormatter.separateScriptureReference(scriptureWithRef);

      return {
        date: formattedDate,
        text: scriptureData.text,
        textContent: scriptureData.textContent,
        explanation: cleanExplanation,
        reference,
      };
    } catch {
      return null;
    }
  }

  /**
   * Clean text by removing unwanted lines and formatting
   * @param {string} text - Raw text to clean
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    // Remove lines starting with ^
    text = text.replace(/^.*\^.*$/gm, '');

    // Remove ONLY standalone month name headers (not dates containing months)
    // Match lines that are ONLY the month name (with possible whitespace)
    Object.keys(SPANISH_MONTHS).forEach((month) => {
      const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
      const regex = new RegExp(`^\\s*${monthCapitalized}\\s*$`, 'gmi');
      text = text.replace(regex, '');
    });

    // Remove empty lines
    text = text.replace(/^\s*[\r\n]/gm, '');

    return text;
  }
}
