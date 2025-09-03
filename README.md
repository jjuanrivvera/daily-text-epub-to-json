# Daily Text EPUB to JSON

[![CI](https://github.com/jjuanrivvera/daily-text-epub-to-json/actions/workflows/ci.yml/badge.svg)](https://github.com/jjuanrivvera/daily-text-epub-to-json/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

Extract and process daily text content from Spanish EPUB files to JSON format. This tool processes Jehovah's Witnesses daily text publications, extracting scripture, explanations, and references into a structured JSON format. Available as a CLI tool, web interface, and REST API.

## 🚀 Features

- **🌐 Web Interface**: Modern React-based UI with drag-and-drop support
- **🔧 REST API**: Full-featured API server with real-time progress updates
- **💻 CLI Tool**: Command-line interface with npx support
- **📱 Responsive Design**: Works on desktop and mobile devices
- **📋 Copy to Clipboard**: One-click JSON copying in the web interface
- **🔄 Real-time Progress**: Server-Sent Events for live processing updates
- **📊 Year Auto-detection**: Automatically detects year from EPUB content
- **🎯 Dual Parsing Strategy**: HTML structure parsing with fallback
- **📅 Special Date Handling**: Supports Memorial (Conmemoración) format
- **💾 Flexible Storage**: Export to JSON file or MongoDB database
- **🏗️ Modern Architecture**: ES6 modules with TypeScript support
- **✅ Comprehensive Testing**: Jest test suite with high coverage
- **🚀 CI/CD Pipeline**: Automated testing and deployment

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- MongoDB (optional, for database storage)

## 🛠️ Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/jjuanrivvera/daily-text-epub-to-json.git
cd daily-text-epub-to-json

# Install dependencies
npm install

# Start the web interface and API server
npm run dev:all
```

Open your browser at http://localhost:5174 to use the web interface.

### Option 1: Use CLI with npx (no installation needed)

```bash
# Process an EPUB file directly
npx daily-text-epub-to-json es25_S.epub
```

### Option 2: Install locally for all features

```bash
# Clone the repository
git clone https://github.com/jjuanrivvera/daily-text-epub-to-json.git
cd daily-text-epub-to-json

# Install dependencies
npm install

# For web interface development
cd web && npm install
```

## ⚙️ Configuration

Create a `.env` file in the project root (optional for CLI usage):

```env
# Optional - Auto-detected from EPUB content if not specified
EPUB_FILE=es25_S.zip    # Name of the EPUB file in the Epubs folder
YEAR=2025                # Year of the daily texts (auto-detected if omitted)

# Optional - MongoDB configuration
MONGODB_URI=mongodb://localhost:27017/dailytexts
```

### Directory Structure

```
daily-text-epub-to-json/
├── Epubs/              # Place your EPUB files here
├── Lab/                # Extracted XHTML files (auto-generated)
├── src/                # Source code (ES6 modules)
│   ├── index.js        # Main entry point
│   ├── parser/         # Parsing logic
│   ├── formatter/      # Date and reference formatting
│   ├── storage/        # JSON and MongoDB storage
│   └── utils/          # Utilities and constants
├── Models/             # Legacy MongoDB models (CommonJS)
├── output.json         # Generated JSON output
└── .env                # Configuration file
```

## 🎯 Usage

### 🌐 Web Interface

The web interface provides a modern, user-friendly way to process EPUB files:

#### Features

- **Drag & Drop Upload**: Simply drag your EPUB file onto the upload area
- **Real-time Progress**: Watch the extraction and processing progress live
- **Interactive JSON Viewer**:
  - Preview mode with expandable daily texts
  - Raw JSON mode with syntax highlighting
  - Copy to clipboard functionality
- **Year Detection Display**: Shows detected year and text count
- **Download Results**: Download processed JSON directly from the browser
- **Responsive Design**: Works on desktop, tablet, and mobile devices

#### Starting the Web Interface

```bash
# Start both web interface and API server
npm run dev:all

# Or start separately:
npm run dev:server  # Start API server on port 3001
cd web && npm run dev  # Start web interface on port 5174
```

Access the web interface at: http://localhost:5174

#### Web Interface Usage

1. Open http://localhost:5174 in your browser
2. Drag and drop your EPUB file or click to select
3. Watch real-time processing progress
4. View results in Preview or Raw JSON mode
5. Copy JSON to clipboard or download as file

### 🔧 Server API

The REST API server provides programmatic access to the processing functionality:

#### API Endpoints

##### `POST /api/process`

Process an EPUB file and return JSON data.

```bash
curl -X POST http://localhost:3001/api/process \
  -F "epub=@es25_S.epub" \
  -H "X-Session-ID: unique-session-id"
```

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: EPUB file as form data
- Headers:
  - `X-Session-ID`: Unique session identifier for SSE events

**Response:**

```json
{
  "jobId": "job-1234567890",
  "status": "started",
  "message": "Processing started"
}
```

##### `GET /api/events/:sessionId`

Server-Sent Events endpoint for real-time progress updates.

```javascript
const eventSource = new EventSource('/api/events/unique-session-id');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data);
};
```

**Event Types:**

- `connected`: Connection established
- `progress`: Processing progress update
- `complete`: Processing completed
- `error`: Processing error

##### `GET /api/download/:resultId`

Download processed JSON results.

```bash
curl http://localhost:3001/api/download/result-id-1234 -o output.json
```

##### `GET /api/health`

Health check endpoint.

```bash
curl http://localhost:3001/api/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-09T12:00:00.000Z",
  "uptime": 123.456
}
```

#### Starting the API Server

```bash
# Production mode
npm run start:server

# Development mode with auto-reload
npm run dev:server

# With custom port
PORT=8080 npm run dev:server
```

Default server URL: http://localhost:3001

### 💻 CLI Usage

```bash
# Basic usage with automatic year detection
npx daily-text-epub-to-json es25_S.epub

# With custom options
npx daily-text-epub-to-json es25_S.epub --year 2025
npx daily-text-epub-to-json es25_S.epub --output custom-output.json
npx daily-text-epub-to-json es25_S.epub --mongo --verbose

# Extract only (no processing)
npx daily-text-epub-to-json es25_S.epub --extract-only

# Process only (after extraction)
npx daily-text-epub-to-json es25_S.epub --process-only
```

#### CLI Options

| Option            | Description                         |
| ----------------- | ----------------------------------- |
| `--year <year>`   | Override automatic year detection   |
| `--output <path>` | Custom output path for JSON file    |
| `--mongo`         | Enable MongoDB storage              |
| `--verbose`       | Enable verbose logging              |
| `--extract-only`  | Only extract EPUB, don't process    |
| `--process-only`  | Only process files, skip extraction |
| `-V, --version`   | Display version information         |
| `-h, --help`      | Display help information            |

### npm Scripts

```bash
# Complete build process (extract + process)
npm run build

# Using the CLI through npm
npm run cli es25_S.epub

# Step-by-step execution
npm run extract  # Extract EPUB to Lab folder
npm run process  # Process extracted files to JSON

# Legacy commands (CommonJS version)
npm run build:legacy
```

### Output Format

The tool generates an `output.json` file with 365 daily texts:

```json
[
  {
    "date": "2025-01-01",
    "text": "(Juan 3:16).",
    "textContent": "Porque tanto amó Dios al mundo que dio a su Hijo unigénito.",
    "explanation": "Detailed explanation of the scripture...",
    "reference": "w23.01 15 párr. 10"
  }
  // ... 364 more entries
]
```

### Field Descriptions

- **date**: ISO format date (YYYY-MM-DD)
- **text**: Scripture reference in parentheses
- **textContent**: The actual scripture text
- **explanation**: Commentary and explanation
- **reference**: Watchtower publication reference

## 🧪 Development

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Project Architecture

The project uses a modular ES6 architecture with three main components:

#### Core Processing Engine

- **Parser Module**: Handles XHTML parsing with dual strategy
- **Formatter Module**: Date and reference formatting
- **Storage Module**: JSON and MongoDB persistence
- **Utils Module**: Shared constants and logging

#### Web Interface (React + Vite)

- **React Components**: Modular UI components
- **Custom Hooks**: `useEpubProcessor` for state management
- **Real-time Updates**: Server-Sent Events integration
- **Responsive Design**: Mobile-first CSS approach
- **Features**:
  - Drag & drop file upload
  - Progress tracking with animations
  - JSON viewer with syntax highlighting
  - Clipboard API integration

#### API Server (Express.js)

- **RESTful Endpoints**: Clean API design
- **SSE Support**: Real-time progress streaming
- **File Management**: Multer for file uploads
- **Job Queue**: In-memory job tracking
- **CORS Enabled**: Cross-origin support
- **Error Handling**: Comprehensive error responses

### Key Technical Features

1. **Automatic Year Detection**
   - Detects year from EPUB content metadata
   - Multiple detection strategies (OPF, file patterns, title page)
   - No dependency on filename conventions

2. **Dual Parsing Strategy**
   - Primary: HTML structure parsing for accurate extraction
   - Fallback: Sanitized text parsing for compatibility

3. **Line Ending Compatibility**
   - Handles both `\r\n` (Windows) and `\n` (Unix) formats
   - Dynamic detection and processing

4. **Memorial Date Handling**
   - Special parsing for "CONMEMORACIÓN" format
   - Extracts embedded date from special formatting

5. **Error Recovery**
   - Graceful fallback mechanisms
   - Comprehensive logging for debugging

## 🔄 CI/CD

The project includes GitHub Actions workflows for:

- **Continuous Integration**: Runs on all pushes and PRs
- **Multi-version Testing**: Tests on Node.js 18.x and 20.x
- **Code Quality**: ESLint and Prettier checks
- **Security Scanning**: npm audit for vulnerabilities
- **Automated Releases**: Tag-based release creation
- **Dependency Updates**: Automated Dependabot PRs

## 📦 Scripts Reference

### Main Scripts

| Script                 | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev:all`      | Start both web interface and API server |
| `npm run dev:server`   | Start API server in development mode    |
| `npm run dev:web`      | Start web interface in development mode |
| `npm run start:server` | Start API server in production mode     |
| `npm run build`        | Complete extraction and processing      |
| `npm run cli <file>`   | Run CLI with an EPUB file               |

### Processing Scripts

| Script                 | Description                 |
| ---------------------- | --------------------------- |
| `npm run extract`      | Extract EPUB to Lab folder  |
| `npm run process`      | Process Lab files to JSON   |
| `npm run build:legacy` | Run legacy CommonJS version |

### Development Scripts

| Script                  | Description                    |
| ----------------------- | ------------------------------ |
| `npm test`              | Run Jest test suite            |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint`          | Check code with ESLint         |
| `npm run lint:fix`      | Auto-fix ESLint issues         |
| `npm run format`        | Format code with Prettier      |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Node.js and modern JavaScript
- Uses sanitize-html for safe HTML processing
- Powered by Jest for testing
- CI/CD with GitHub Actions

## 📞 Support

For issues or questions, please [open an issue](https://github.com/jjuanrivvera/daily-text-epub-to-json/issues) on GitHub.

---

Made with ❤️ by [jjuanrivvera](https://github.com/jjuanrivvera)
