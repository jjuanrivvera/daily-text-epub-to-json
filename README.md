# Daily Text EPUB to JSON

[![CI](https://github.com/jjuanrivvera/daily-text-epub-to-json/actions/workflows/ci.yml/badge.svg)](https://github.com/jjuanrivvera/daily-text-epub-to-json/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)

Extract and process daily text content from Spanish EPUB files to JSON format. This tool processes Jehovah's Witnesses daily text publications, extracting scripture, explanations, and references into a structured JSON format.

## 🚀 Features

- **EPUB Extraction**: Unzip and extract XHTML content from EPUB files
- **Dual Parsing Strategy**: HTML structure parsing with fallback to sanitized text
- **Special Date Handling**: Supports Memorial (Conmemoración) date format
- **Flexible Output**: Export to JSON file or MongoDB database
- **Modern Architecture**: ES6 modules with legacy CommonJS compatibility
- **Cross-platform**: Handles both Windows (\r\n) and Unix (\n) line endings
- **Comprehensive Testing**: Jest test suite with 100% critical path coverage
- **CI/CD Pipeline**: Automated testing and deployment with GitHub Actions

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- MongoDB (optional, for database storage)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/jjuanrivvera/daily-text-epub-to-json.git
cd daily-text-epub-to-json

# Install dependencies
npm install
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
# Required
EPUB_FILE=es25_S.zip    # Name of the EPUB file in the Epubs folder
YEAR=2025                # Year of the daily texts

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

### Basic Commands

```bash
# Complete build process (extract + process)
npm run build

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
  },
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

The project uses a modular ES6 architecture:

- **Parser Module**: Handles XHTML parsing with dual strategy
- **Formatter Module**: Date and reference formatting
- **Storage Module**: JSON and MongoDB persistence
- **Utils Module**: Shared constants and logging

### Key Technical Features

1. **Dual Parsing Strategy**
   - Primary: HTML structure parsing for accurate extraction
   - Fallback: Sanitized text parsing for compatibility

2. **Line Ending Compatibility**
   - Handles both `\r\n` (Windows) and `\n` (Unix) formats
   - Dynamic detection and processing

3. **Memorial Date Handling**
   - Special parsing for "CONMEMORACIÓN" format
   - Extracts embedded date from special formatting

4. **Error Recovery**
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

| Script | Description |
|--------|-------------|
| `npm run build` | Complete extraction and processing |
| `npm run extract` | Extract EPUB to Lab folder |
| `npm run process` | Process Lab files to JSON |
| `npm test` | Run Jest test suite |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |

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