#!/usr/bin/env node
'use strict';

require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get year from environment variable
const year = process.env.YEAR;
if (!year) {
  console.error('Error: YEAR environment variable not set in .env file');
  process.exit(1);
}

// Determine the file to extract based on year
// Year format: 2021 -> 21, 2025 -> 25
const shortYear = year.slice(-2);
const epubFile = `es${shortYear}_S.zip`;
const epubPath = path.join(__dirname, 'Epubs', epubFile);

// Check if file exists
if (!fs.existsSync(epubPath)) {
  console.error(`Error: EPUB file not found: ${epubPath}`);
  console.error(`Please ensure ${epubFile} exists in the Epubs directory`);
  process.exit(1);
}

console.log(`Extracting EPUB for year ${year}: ${epubFile}`);

// Clean Lab directory
if (fs.existsSync('Lab')) {
  console.log('Cleaning existing Lab directory...');
  fs.rmSync('Lab', { recursive: true, force: true });
}

// Create Lab directory
fs.mkdirSync('Lab', { recursive: true });

// Run unzip script
const unzipProcess = spawn('node', [path.join(__dirname, 'unzip.js'), epubPath], {
  cwd: path.join(__dirname, 'Lab'),
  stdio: 'inherit',
});

unzipProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Extraction failed with exit code ${code}`);
    process.exit(code);
  }
  console.log('Extraction completed successfully!');
});

unzipProcess.on('error', (err) => {
  console.error('Failed to start extraction process:', err);
  process.exit(1);
});
