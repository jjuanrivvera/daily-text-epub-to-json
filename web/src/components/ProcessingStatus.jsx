import React from 'react';
import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';

function ProcessingStatus({ progress, onCancel }) {
  if (!progress) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
        <p>Initializing...</p>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (progress.status === 'error') {
      return <AlertCircle size={48} color="#ef4444" />;
    }
    if (progress.status === 'completed') {
      return <CheckCircle size={48} color="#10b981" />;
    }
    return <Loader2 size={48} color="#646cff" className="animate-spin" />;
  };

  const getStatusColor = () => {
    if (progress.status === 'error') return '#ef4444';
    if (progress.status === 'completed') return '#10b981';
    return '#646cff';
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Processing EPUB File</h2>

      <div style={{ margin: '2rem 0' }}>{getStatusIcon()}</div>

      <div style={{ margin: '2rem 0' }}>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress.progress || 0}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            opacity: 0.8,
          }}
        >
          <span>{progress.message || 'Processing...'}</span>
          <span>{Math.round(progress.progress || 0)}%</span>
        </div>
      </div>

      {progress.status === 'processing' && (
        <div style={{ margin: '1rem 0' }}>
          <p style={{ margin: 0, opacity: 0.8 }}>
            {progress.filename && `Processing: ${progress.filename}`}
          </p>
          {progress.startTime && (
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.6 }}>
              Started: {new Date(progress.startTime).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {progress.status === 'completed' && progress.count && (
        <div className="success">
          <strong>Success!</strong> Generated {progress.count} daily texts for year {progress.year}
        </div>
      )}

      {progress.status === 'error' && (
        <div className="error">
          <strong>Processing Failed</strong>
          <br />
          {progress.error || 'An unexpected error occurred'}
        </div>
      )}

      {progress.status === 'processing' && (
        <div style={{ marginTop: '2rem' }}>
          <button
            className="button secondary"
            onClick={onCancel}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      )}

      {(progress.status === 'completed' || progress.status === 'error') && (
        <div style={{ marginTop: '2rem' }}>
          <button className="button secondary" onClick={onCancel}>
            Process Another File
          </button>
        </div>
      )}
    </div>
  );
}

export default ProcessingStatus;
