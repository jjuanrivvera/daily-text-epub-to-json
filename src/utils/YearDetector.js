import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import yauzl from 'yauzl';
import { promisify } from 'util';
import logger from './logger.js';

/**
 * YearDetector - Detects year from EPUB content using multiple strategies
 * 
 * Detection strategies in priority order:
 * 1. OPF metadata (<dc:title>Examinemos 2025)
 * 2. File pattern (110YYYY###.xhtml files)
 * 3. Title page content
 * 4. Fallback to current year
 */
export class YearDetector {
  /**
   * Detecta el año del archivo EPUB analizando su contenido
   * @param {string} epubPath - Ruta al archivo EPUB
   * @returns {Promise<string>} - Año detectado (ej: "2025")
   */
  static async detectYear(epubPath) {
    logger.debug(`Detecting year from: ${epubPath}`);
    
    // Verificar que el archivo existe
    try {
      await fs.access(epubPath);
    } catch (error) {
      throw new Error(`EPUB file not found: ${epubPath}`);
    }
    
    // Crear directorio temporal
    const tempDir = path.join(os.tmpdir(), `epub-detect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      // Extraer archivos necesarios
      await this.extractMinimalFiles(epubPath, tempDir);
      
      // Intentar detectar en orden de prioridad
      const strategies = [
        { name: 'OPF metadata', method: () => this.detectFromOPF(tempDir) },
        { name: 'file pattern', method: () => this.detectFromFilePattern(tempDir) },
        { name: 'title page', method: () => this.detectFromTitlePage(tempDir) }
      ];
      
      for (const strategy of strategies) {
        try {
          logger.debug(`Attempting year detection using: ${strategy.name}`);
          const year = await strategy.method();
          if (year && this.validateYear(year)) {
            logger.info(`Year detected via ${strategy.name}: ${year}`);
            return year;
          }
        } catch (error) {
          logger.debug(`${strategy.name} detection failed: ${error.message}`);
        }
      }
      
      // Fallback al año actual
      const currentYear = new Date().getFullYear().toString();
      logger.warn(`Could not detect year from content, using current: ${currentYear}`);
      return currentYear;
      
    } finally {
      // Limpiar directorio temporal
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.warn(`Failed to clean up temp directory: ${cleanupError.message}`);
      }
    }
  }
  
  /**
   * Extrae solo los archivos necesarios para la detección
   * Siguiendo best practices de yauzl para manejo de errores y recursos
   */
  static async extractMinimalFiles(epubPath, targetDir) {
    const openZip = promisify(yauzl.open);
    
    return new Promise((resolve, reject) => {
      // Patrones de archivos a extraer
      const filesToExtract = [
        'OEBPS/content.opf',                    // Metadata OPF
        /OEBPS\/110\d{7}\.xhtml$/,              // Archivos principales (110YYYY###.xhtml)
        /OEBPS\/.*212\.xhtml$/                  // Archivo de portada (contiene 212)
      ];
      
      yauzl.open(epubPath, { lazyEntries: true, autoClose: true }, (err, zipfile) => {
        if (err) {
          return reject(new Error(`Failed to open EPUB file: ${err.message}`));
        }
        
        // Manejar errores del zipfile siguiendo best practices
        zipfile.on('error', (zipError) => {
          reject(new Error(`ZIP file error: ${zipError.message}`));
        });
        
        let extractedCount = 0;
        
        zipfile.on('entry', (entry) => {
          // Validar nombre de archivo por seguridad
          const errorMessage = yauzl.validateFileName(entry.fileName);
          if (errorMessage != null) {
            logger.warn(`Skipping invalid file name: ${entry.fileName} - ${errorMessage}`);
            zipfile.readEntry();
            return;
          }
          
          // Verificar si el archivo debe ser extraído
          const shouldExtract = filesToExtract.some(pattern => {
            if (typeof pattern === 'string') {
              return entry.fileName === pattern;
            }
            return pattern.test(entry.fileName);
          });
          
          if (shouldExtract && !entry.fileName.endsWith('/')) {
            // Extraer archivo
            zipfile.openReadStream(entry, (streamErr, readStream) => {
              if (streamErr) {
                logger.warn(`Failed to open read stream for ${entry.fileName}: ${streamErr.message}`);
                zipfile.readEntry();
                return;
              }
              
              // Manejar errores del stream siguiendo best practices
              readStream.on('error', (streamError) => {
                logger.warn(`Read stream error for ${entry.fileName}: ${streamError.message}`);
                zipfile.readEntry();
              });
              
              // Crear directorio si es necesario
              const filePath = path.join(targetDir, entry.fileName);
              const fileDir = path.dirname(filePath);
              
              fs.mkdir(fileDir, { recursive: true })
                .then(() => {
                  const writeStream = createWriteStream(filePath);
                  
                  writeStream.on('error', (writeError) => {
                    logger.warn(`Write error for ${entry.fileName}: ${writeError.message}`);
                    zipfile.readEntry();
                  });
                  
                  writeStream.on('finish', () => {
                    extractedCount++;
                    logger.debug(`Extracted: ${entry.fileName}`);
                    zipfile.readEntry();
                  });
                  
                  readStream.pipe(writeStream);
                })
                .catch((mkdirError) => {
                  logger.warn(`Failed to create directory for ${entry.fileName}: ${mkdirError.message}`);
                  zipfile.readEntry();
                });
            });
          } else {
            // Saltar directorio o archivo no requerido
            zipfile.readEntry();
          }
        });
        
        zipfile.on('end', () => {
          logger.debug(`Extraction completed. Files extracted: ${extractedCount}`);
          resolve();
        });
        
        // Iniciar procesamiento de entradas
        zipfile.readEntry();
      });
    });
  }
  
  /**
   * Detecta el año desde el archivo OPF
   * Strategy 1: Most reliable source
   */
  static async detectFromOPF(tempDir) {
    const opfPath = path.join(tempDir, 'OEBPS', 'content.opf');
    
    try {
      const content = await fs.readFile(opfPath, 'utf-8');
      
      // Buscar en título: <dc:title>Examinemos 2025 (es25-S)</dc:title>
      const titleMatch = content.match(/<dc:title>.*?(\d{4}).*?<\/dc:title>/i);
      if (titleMatch) {
        const year = titleMatch[1];
        logger.debug(`Found year in OPF title: ${year}`);
        return year;
      }
      
      // Buscar código: (es25-S) → 2025
      const codeMatch = content.match(/\(es(\d{2})-S\)/i);
      if (codeMatch) {
        const shortYear = parseInt(codeMatch[1]);
        // Asumimos años 2000-2099 (00-99 → 2000-2099)
        const year = shortYear < 100 ? `20${codeMatch[1].padStart(2, '0')}` : `19${codeMatch[1]}`;
        logger.debug(`Found year in OPF code: ${year} (from ${codeMatch[1]})`);
        return year;
      }
      
      // Buscar cualquier año de 4 dígitos en el contenido
      const generalYearMatch = content.match(/\b(20\d{2})\b/);
      if (generalYearMatch) {
        const year = generalYearMatch[1];
        logger.debug(`Found general year in OPF: ${year}`);
        return year;
      }
      
    } catch (error) {
      logger.debug('Could not read OPF file:', error.message);
    }
    
    return null;
  }
  
  /**
   * Detecta el año desde el patrón de nombres de archivo
   * Strategy 2: Consistent pattern across EPUBs
   */
  static async detectFromFilePattern(tempDir) {
    const oebpsDir = path.join(tempDir, 'OEBPS');
    
    try {
      const files = await fs.readdir(oebpsDir);
      
      // Buscar archivos con patrón 110YYYY###.xhtml
      for (const file of files) {
        const match = file.match(/^110(\d{4})\d{3}\.xhtml$/);
        if (match) {
          const year = match[1];
          logger.debug(`Found year in file pattern: ${year} (from ${file})`);
          return year;
        }
      }
      
    } catch (error) {
      logger.debug('Could not read OEBPS directory:', error.message);
    }
    
    return null;
  }
  
  /**
   * Detecta el año desde la página de título
   * Strategy 3: Human-readable confirmation
   */
  static async detectFromTitlePage(tempDir) {
    const oebpsDir = path.join(tempDir, 'OEBPS');
    
    try {
      const files = await fs.readdir(oebpsDir);
      
      // Buscar archivo de portada (típicamente contiene "212")
      const titleFiles = files.filter(f => 
        f.includes('212') && f.endsWith('.xhtml')
      );
      
      // Procesar cada archivo de título potencial
      for (const titleFile of titleFiles) {
        try {
          const content = await fs.readFile(
            path.join(oebpsDir, titleFile),
            'utf-8'
          );
          
          // Buscar "Examinemos las Escrituras todos los días 2025"
          const examineMatch = content.match(/Examinemos.*?(\d{4})/i);
          if (examineMatch) {
            const year = examineMatch[1];
            logger.debug(`Found year in title page (examine): ${year} (from ${titleFile})`);
            return year;
          }
          
          // Buscar cualquier patrón de año en títulos o headers
          const titleYearMatch = content.match(/<h[1-6][^>]*>.*?(\d{4}).*?<\/h[1-6]>/i);
          if (titleYearMatch) {
            const year = titleYearMatch[1];
            logger.debug(`Found year in title header: ${year} (from ${titleFile})`);
            return year;
          }
          
          // Buscar año en cualquier parte del contenido como último recurso
          const generalYearMatch = content.match(/\b(20\d{2})\b/);
          if (generalYearMatch) {
            const year = generalYearMatch[1];
            logger.debug(`Found general year in title page: ${year} (from ${titleFile})`);
            return year;
          }
          
        } catch (fileError) {
          logger.debug(`Could not read title file ${titleFile}: ${fileError.message}`);
        }
      }
      
    } catch (error) {
      logger.debug('Could not read title page:', error.message);
    }
    
    return null;
  }
  
  /**
   * Valida que un año detectado sea razonable
   * @param {string} year - Año a validar
   * @returns {boolean} - True si el año es válido
   */
  static validateYear(year) {
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    
    // Validar rango razonable (1990-currentYear+10)
    const isValid = yearNum >= 1990 && yearNum <= currentYear + 10;
    
    if (!isValid) {
      logger.debug(`Year ${year} failed validation (out of range 1990-${currentYear + 10})`);
    }
    
    return isValid;
  }
}