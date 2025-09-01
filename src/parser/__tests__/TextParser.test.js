import { TextParser } from '../TextParser.js';

describe('TextParser', () => {
  let parser;

  beforeEach(() => {
    parser = new TextParser(2025);
  });

  describe('cleanText', () => {
    it('should remove lines starting with ^', () => {
      const text = 'Valid line\n^Line to remove\nAnother valid line';
      const result = parser.cleanText(text);
      expect(result).not.toContain('^Line to remove');
      expect(result).toContain('Valid line');
      expect(result).toContain('Another valid line');
    });

    it('should remove standalone month names', () => {
      const text = 'Valid line\nEnero\nAnother line\n  Diciembre  \nFinal line';
      const result = parser.cleanText(text);
      expect(result).not.toContain('Enero');
      expect(result).not.toMatch(/^\s*Diciembre\s*$/m);
      expect(result).toContain('Valid line');
      expect(result).toContain('Another line');
      expect(result).toContain('Final line');
    });

    it('should keep month names within other text', () => {
      const text = 'Valid line\nDiciembre header\nLunes 1 de enero';
      const result = parser.cleanText(text);
      expect(result).toContain('Diciembre header');
      expect(result).toContain('Lunes 1 de enero');
    });

    it('should remove empty lines', () => {
      const text = 'Line 1\n\n\nLine 2\n   \nLine 3';
      const result = parser.cleanText(text);
      const lines = result.split('\n').filter((line) => line.trim());
      expect(lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });
  });

  describe('parse', () => {
    it('should parse valid XHTML content with complete structure', () => {
      const xhtmlContent = `
        <html>
          <body>
            <h2>Jueves 2 de enero</h2>
            <p class="themeScrp">Esta enfermedad no tiene como finalidad la muerte (Juan 11:4).</p>
            <div class="bodyTxt">
              <p class="p1 sb">Explanation text here w23.04 10 párrs. 10, 11</p>
            </div>
          </body>
        </html>
      `;

      const result = parser.parse(xhtmlContent);

      expect(result).toBeTruthy();
      expect(result.date).toBe('2025-01-02');
      expect(result.text).toBe('(Juan 11:4).');
      expect(result.textContent).toBe('Esta enfermedad no tiene como finalidad la muerte.');
      expect(result.explanation).toBe('Explanation text here');
      expect(result.reference).toBe('w23.04 10 párrs. 10, 11');
    });

    it('should return null for content with insufficient lines', () => {
      const xhtmlContent = '<html><body>Not enough content</body></html>';
      const result = parser.parse(xhtmlContent);
      expect(result).toBeNull();
    });

    it('should handle content with both \\r\\n and \\n line endings', () => {
      const contentWithCRLF = `<html><body>\r\n<h2>Lunes 1 de enero</h2>\r\n<p class="themeScrp">Scripture (Ref 1:1).</p>\r\n<div class="bodyTxt"><p class="p1 sb">Explanation w23.01 1</p></div></body></html>`;
      const contentWithLF = `<html><body>\n<h2>Lunes 1 de enero</h2>\n<p class="themeScrp">Scripture (Ref 1:1).</p>\n<div class="bodyTxt"><p class="p1 sb">Explanation w23.01 1</p></div></body></html>`;

      const result1 = parser.parse(contentWithCRLF);
      const result2 = parser.parse(contentWithLF);

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result1.date).toBe('2025-01-01');
      expect(result2.date).toBe('2025-01-01');
    });

    it('should return null for invalid date format', () => {
      const xhtmlContent = `
        <html>
          <body>
            <h2>Invalid Date Format</h2>
            <p>Scripture text</p>
            <p>Explanation</p>
          </body>
        </html>
      `;

      const result = parser.parse(xhtmlContent);
      expect(result).toBeNull();
    });

    it('should handle missing scripture reference', () => {
      const xhtmlContent = `
        <html>
          <body>
            <h2>Jueves 2 de enero</h2>
            <p class="themeScrp">Scripture without parentheses</p>
            <div class="bodyTxt">
              <p class="p1 sb">Explanation text w23.01 1</p>
            </div>
          </body>
        </html>
      `;

      const result = parser.parse(xhtmlContent);
      expect(result).toBeTruthy();
      expect(result.text).toBe('');
      expect(result.textContent).toBe('Scripture without parentheses');
    });
  });
});
