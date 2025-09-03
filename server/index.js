import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import { DailyTextProcessor } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from web folder
app.use(express.static(path.join(__dirname, '../web/dist')));

// Configure multer for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), 'epub-uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.epub' || ext === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Only EPUB/ZIP files are allowed'));
    }
  },
});

// Store processing jobs and results
const processingJobs = new Map();
const results = new Map();

/**
 * POST /api/process
 * Process an EPUB file and return JSON
 */
app.post('/api/process', upload.single('epub'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    const jobId = `job-${Date.now()}`;
    const sessionId = req.headers['x-session-id'] || jobId;

    console.log(`[${jobId}] Starting processing: ${req.file.originalname}`);

    // Store job info
    processingJobs.set(jobId, {
      sessionId,
      filename: req.file.originalname,
      status: 'processing',
      progress: 0,
      message: 'Starting...',
      startTime: Date.now(),
    });

    // Send initial response
    res.json({
      jobId,
      status: 'started',
      message: 'Processing started',
    });

    // Process file in background
    processFileAsync(req.file.path, jobId, req.body.year).catch((error) => {
      console.error(`[${jobId}] Processing error:`, error);
      processingJobs.set(jobId, {
        ...processingJobs.get(jobId),
        status: 'error',
        error: error.message,
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/status/:jobId
 * Get processing status and progress
 */
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = processingJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

/**
 * GET /api/download/:resultId
 * Download processed JSON result
 */
app.get('/api/download/:resultId', async (req, res) => {
  const { resultId } = req.params;
  const result = results.get(resultId);

  if (!result) {
    return res.status(404).json({ error: 'Result not found' });
  }

  try {
    const jsonContent = JSON.stringify(result.data, null, 2);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="daily-texts-${result.year}.json"`,
      'Content-Length': Buffer.byteLength(jsonContent, 'utf8'),
    });

    res.send(jsonContent);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

/**
 * Server-Sent Events endpoint for real-time progress
 */
app.get('/api/events/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Function to send progress updates
  const sendProgress = () => {
    const jobs = Array.from(processingJobs.values()).filter((job) => job.sessionId === sessionId);

    if (jobs.length > 0) {
      const job = jobs[0];
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          ...job,
        })}\n\n`
      );
    }
  };

  // Send updates every second
  const interval = setInterval(sendProgress, 1000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: '3.0.0',
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Web interface at http://localhost:${PORT}`);
});

/**
 * Process EPUB file asynchronously
 */
async function processFileAsync(filePath, jobId, overrideYear) {
  const job = processingJobs.get(jobId);
  if (!job) return;

  try {
    // Update progress: Starting
    processingJobs.set(jobId, {
      ...job,
      progress: 10,
      message: 'Initializing processor...',
    });

    // Create processor with the uploaded file
    const processor = new DailyTextProcessor(filePath, overrideYear);

    // Update progress: Extracting
    processingJobs.set(jobId, {
      ...job,
      progress: 30,
      message: `Extracting EPUB...`,
    });

    // Extract EPUB
    await processor.extractor.extract();

    // Update year from extraction if it was auto-detected
    if (!processor.year && processor.extractor.year) {
      processor.year = processor.extractor.year;
    }

    // Initialize processor after extraction
    if (!processor.processor) {
      const { FileProcessor } = await import('../src/parser/FileProcessor.js');
      processor.processor = new FileProcessor(processor.year);
    }

    // Update progress: Processing
    processingJobs.set(jobId, {
      ...job,
      progress: 60,
      message: 'Processing XHTML files...',
    });

    // Process files
    const dailyTexts = await processor.processor.processFiles();

    // Update progress: Finalizing
    processingJobs.set(jobId, {
      ...job,
      progress: 90,
      message: 'Finalizing...',
    });

    // Store result
    const resultId = `result-${jobId}`;
    results.set(resultId, {
      year: processor.extractor.year,
      data: dailyTexts,
      generatedAt: new Date().toISOString(),
    });

    // Update progress: Complete
    processingJobs.set(jobId, {
      ...job,
      status: 'completed',
      progress: 100,
      message: 'Processing complete!',
      resultId,
      count: dailyTexts.length,
      year: processor.extractor.year,
      completedAt: Date.now(),
    });

    // Clean up temporary file
    setTimeout(async () => {
      try {
        await fs.unlink(filePath);
        console.log(`[${jobId}] Cleaned up temp file: ${filePath}`);
      } catch (error) {
        console.error(`[${jobId}] Error cleaning temp file:`, error);
      }
    }, 1000);

    // Clean up Lab directory
    await processor.extractor.cleanLabDirectory();
  } catch (error) {
    console.error(`[${jobId}] Processing error:`, error);
    processingJobs.set(jobId, {
      ...job,
      status: 'error',
      error: error.message,
      completedAt: Date.now(),
    });

    // Clean up on error
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error(`[${jobId}] Error cleaning up after failure:`, cleanupError);
    }
  }
}

// Cleanup old jobs and results periodically
setInterval(
  () => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [jobId, job] of processingJobs) {
      if (job.completedAt && now - job.completedAt > maxAge) {
        processingJobs.delete(jobId);
        console.log(`Cleaned up old job: ${jobId}`);
      }
    }

    for (const [resultId, result] of results) {
      const resultAge = now - new Date(result.generatedAt).getTime();
      if (resultAge > maxAge) {
        results.delete(resultId);
        console.log(`Cleaned up old result: ${resultId}`);
      }
    }
  },
  5 * 60 * 1000
); // Run every 5 minutes

export default app;
