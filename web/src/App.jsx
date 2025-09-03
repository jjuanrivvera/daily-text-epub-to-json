import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import JsonViewer from './components/JsonViewer';
import { useEpubProcessor } from './hooks/useEpubProcessor';
import { BookOpen, Github, ExternalLink } from 'lucide-react';

function App() {
  const { processing, progress, result, error, processFile, downloadResult, reset } =
    useEpubProcessor();

  const [view, setView] = useState('upload'); // upload | processing | result

  useEffect(() => {
    if (processing) {
      setView('processing');
    } else if (result) {
      setView('result');
    } else {
      setView('upload');
    }
  }, [processing, result]);

  const handleFileSelect = async (file) => {
    try {
      await processFile(file);
    } catch (err) {
      console.error('Processing error:', err);
    }
  };

  const handleReset = () => {
    reset();
    setView('upload');
  };

  const handleDownload = () => {
    downloadResult();
  };

  return (
    <div className="app">
      <header style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <BookOpen size={32} />
          <h1 style={{ margin: 0 }}>Daily Text EPUB to JSON</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Convert JW daily text EPUB files to JSON format with a modern web interface
        </p>
      </header>

      <main>
        {view === 'upload' && (
          <div className="card">
            <h2>Upload EPUB File</h2>
            <p>Select an EPUB file to convert to JSON format</p>
            <FileUpload onFileSelect={handleFileSelect} disabled={processing} error={error} />
            {error && (
              <div className="error">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        )}

        {view === 'processing' && progress && (
          <div className="card">
            <ProcessingStatus progress={progress} onCancel={handleReset} />
          </div>
        )}

        {view === 'result' && result && (
          <div>
            <div className="card">
              <h2>✅ Processing Complete!</h2>
              <div className="success">
                Successfully processed {result.count} daily texts for year {result.year}
              </div>

              <div className="stats">
                <div className="stat">
                  <div className="stat-value">{result.year}</div>
                  <div className="stat-label">Year</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{result.count}</div>
                  <div className="stat-label">Daily Texts</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  marginTop: '1.5rem',
                }}
              >
                <button className="button primary" onClick={handleDownload}>
                  Download JSON
                </button>
                <button className="button secondary" onClick={handleReset}>
                  Process Another File
                </button>
              </div>
            </div>

            <div className="card">
              <JsonViewer data={result.data} />
            </div>
          </div>
        )}
      </main>

      <footer style={{ marginTop: '3rem', opacity: 0.7, fontSize: '0.875rem' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
        >
          <span>Daily Text EPUB to JSON v3.0</span>
          <a
            href="https://github.com/jjuanrivvera/daily-text-epub-to-json"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Github size={16} />
            <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
