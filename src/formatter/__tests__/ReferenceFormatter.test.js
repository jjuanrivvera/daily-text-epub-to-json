import { ReferenceFormatter } from '../ReferenceFormatter.js';

describe('ReferenceFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new ReferenceFormatter();
  });

  describe('extractReference', () => {
    it('should extract watchtower reference', () => {
      const text = 'Some explanation text w23.04 10 párrs. 10, 11';
      const result = formatter.extractReference(text);
      expect(result).toBe('w23.04 10 párrs. 10, 11');
    });

    it('should return empty string if no reference found', () => {
      const text = 'Some explanation text';
      const result = formatter.extractReference(text);
      expect(result).toBe('');
    });

    it('should handle empty text', () => {
      expect(formatter.extractReference('')).toBe('');
      expect(formatter.extractReference(null)).toBe('');
      expect(formatter.extractReference(undefined)).toBe('');
    });
  });

  describe('separateScriptureReference', () => {
    it('should separate scripture text and reference', () => {
      const text =
        'Esta enfermedad no tiene como finalidad la muerte, sino que servirá para la gloria de Dios (Juan 11:4).';
      const result = formatter.separateScriptureReference(text);

      expect(result.text).toBe('(Juan 11:4).');
      expect(result.textContent).toBe(
        'Esta enfermedad no tiene como finalidad la muerte, sino que servirá para la gloria de Dios.'
      );
    });

    it('should handle text without parentheses', () => {
      const text = 'Some text without reference';
      const result = formatter.separateScriptureReference(text);

      expect(result.text).toBe('');
      expect(result.textContent).toBe('Some text without reference');
    });

    it('should handle multiple parentheses', () => {
      const text = 'Text with (first) and (second) references.';
      const result = formatter.separateScriptureReference(text);

      expect(result.text).toBe('(first) and (second) references.');
      expect(result.textContent).toBe('Text with.');
    });

    it('should format textContent with period', () => {
      const text = 'Some text (Reference 1:1).';
      const result = formatter.separateScriptureReference(text);

      expect(result.text).toBe('(Reference 1:1).');
      expect(result.textContent).toBe('Some text.');
    });

    it('should handle empty input', () => {
      expect(formatter.separateScriptureReference('')).toEqual({
        text: '',
        textContent: '',
      });
      expect(formatter.separateScriptureReference(null)).toEqual({
        text: '',
        textContent: '',
      });
    });
  });
});
