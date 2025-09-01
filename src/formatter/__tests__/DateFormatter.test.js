import { DateFormatter } from '../DateFormatter.js';

describe('DateFormatter', () => {
  let formatter;

  beforeEach(() => {
    formatter = new DateFormatter(2025);
  });

  describe('format', () => {
    it('should format Spanish date correctly', () => {
      const result = formatter.format('Jueves 2 de enero');
      expect(result).toBe('2025-01-02');
    });

    it('should handle different Spanish days', () => {
      expect(formatter.format('Lunes 1 de enero')).toBe('2025-01-01');
      expect(formatter.format('Martes 15 de febrero')).toBe('2025-02-15');
      expect(formatter.format('Miércoles 31 de diciembre')).toBe('2025-12-31');
    });

    it('should handle all Spanish months', () => {
      const months = [
        ['enero', '01'],
        ['febrero', '02'],
        ['marzo', '03'],
        ['abril', '04'],
        ['mayo', '05'],
        ['junio', '06'],
        ['julio', '07'],
        ['agosto', '08'],
        ['septiembre', '09'],
        ['octubre', '10'],
        ['noviembre', '11'],
        ['diciembre', '12'],
      ];

      months.forEach(([month, number]) => {
        const result = formatter.format(`Lunes 1 de ${month}`);
        expect(result).toBe(`2025-${number}-01`);
      });
    });

    it('should return null for invalid date format', () => {
      expect(formatter.format('Invalid date')).toBeNull();
      expect(formatter.format('de enero')).toBeNull();
      expect(formatter.format('Lunes enero')).toBeNull();
    });

    it('should handle dates with single day numbers', () => {
      const result = formatter.format('1 de enero');
      expect(result).toBe('2025-01-01');
    });

    it('should handle dates with different day numbers', () => {
      expect(formatter.format('Viernes 5 de marzo')).toBe('2025-03-05');
      expect(formatter.format('Sábado 20 de octubre')).toBe('2025-10-20');
      expect(formatter.format('Domingo 31 de agosto')).toBe('2025-08-31');
    });
  });
});
