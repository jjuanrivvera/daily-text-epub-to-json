/**
 * Constants used throughout the application
 */

export const SPANISH_MONTHS = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

export const FILE_PATTERNS = {
  XHTML: /\.xhtml$/,
  EXTRACTED: /-extracted\d*\.xhtml$/, // More specific pattern for extracted files
  SPLIT: /split\d+/,
};

export const REFERENCE_PATTERNS = {
  WATCHTOWER: / w/,
  SCRIPTURE_PARENTHESIS: /\(/,
};

export const FILES_TO_SKIP = ['cover.xhtml', 'pagenav.xhtml', 'toc.xhtml'];
