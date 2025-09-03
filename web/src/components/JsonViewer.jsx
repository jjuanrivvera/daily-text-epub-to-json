import React, { useState, useCallback, useRef } from 'react';
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Calendar,
  FileText,
  Hash,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

function JsonViewer({ data }) {
  const [showPreview, setShowPreview] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set([0, 1, 2])); // Show first 3 items expanded
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'raw'
  const [expandedTexts, setExpandedTexts] = useState(new Set()); // Track which texts are fully expanded
  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copying' | 'success' | 'error'
  const timeoutRef = useRef(null);

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const expandAll = () => {
    setExpandedItems(new Set(data.map((_, index) => index)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  const formatDate = (dateStr) => {
    try {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Enhanced clipboard copy function with fallback
  const copyToClipboard = useCallback(async (text) => {
    try {
      // Modern Clipboard API (preferred)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    } catch (error) {
      console.error('Failed to copy text: ', error);
      return false;
    }
  }, []);

  const handleCopyJson = useCallback(async () => {
    if (copyStatus === 'copying') return; // Prevent multiple simultaneous copies

    setCopyStatus('copying');

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const success = await copyToClipboard(jsonString);

      setCopyStatus(success ? 'success' : 'error');

      // Reset status after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      setCopyStatus('error');

      timeoutRef.current = setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  }, [data, copyToClipboard, copyStatus]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Early return after all hooks
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div>
        <h3>JSON Preview</h3>
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            opacity: 0.6,
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
          }}
        >
          No data to display
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <h3 style={{ margin: 0 }}>JSON Preview</h3>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className={`button ${viewMode === 'preview' ? 'primary' : 'secondary'}`}
            onClick={() => setViewMode('preview')}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            Preview
          </button>
          <button
            className={`button ${viewMode === 'raw' ? 'primary' : 'secondary'}`}
            onClick={() => setViewMode('raw')}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            Raw JSON
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.875rem',
          opacity: 0.7,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Hash size={14} />
          {data.length} entries
        </span>
        {data[0]?.date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={14} />
            {formatDate(data[0].date)} - {formatDate(data[data.length - 1]?.date)}
          </span>
        )}
      </div>

      {viewMode === 'raw' ? (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <FileText size={14} />
              JSON ({Math.round(JSON.stringify(data).length / 1024)} KB)
            </div>
            <button
              className={`button ${
                copyStatus === 'success'
                  ? 'success'
                  : copyStatus === 'error'
                    ? 'error'
                    : 'secondary'
              }`}
              onClick={handleCopyJson}
              disabled={copyStatus === 'copying'}
              style={{
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                opacity: copyStatus === 'copying' ? 0.7 : 1,
              }}
              aria-label={
                copyStatus === 'success'
                  ? 'JSON copied successfully'
                  : copyStatus === 'error'
                    ? 'Failed to copy JSON'
                    : copyStatus === 'copying'
                      ? 'Copying JSON...'
                      : 'Copy JSON to clipboard'
              }
            >
              {copyStatus === 'copying' && (
                <div className="animate-spin">
                  <Copy size={16} />
                </div>
              )}
              {copyStatus === 'success' && <Check size={16} />}
              {copyStatus === 'error' && <AlertCircle size={16} />}
              {copyStatus === 'idle' && <Copy size={16} />}

              {copyStatus === 'copying' && 'Copying...'}
              {copyStatus === 'success' && 'Copied!'}
              {copyStatus === 'error' && 'Failed'}
              {copyStatus === 'idle' && 'Copy JSON'}
            </button>
          </div>

          <div className="json-viewer">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              className="button secondary"
              onClick={expandAll}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            >
              <Eye size={12} style={{ marginRight: '0.25rem' }} />
              Expand All
            </button>
            <button
              className="button secondary"
              onClick={collapseAll}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            >
              <EyeOff size={12} style={{ marginRight: '0.25rem' }} />
              Collapse All
            </button>
          </div>

          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {data.map((item, index) => (
              <div
                key={index}
                style={{
                  borderBottom:
                    index < data.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    marginBottom: expandedItems.has(index) ? '0.75rem' : 0,
                  }}
                  onClick={() => toggleExpanded(index)}
                >
                  {expandedItems.has(index) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <Calendar size={14} />
                  <strong>{item.date}</strong>
                  <span style={{ opacity: 0.6, fontSize: '0.875rem' }}>
                    {formatDate(item.date)}
                  </span>
                </div>

                {expandedItems.has(index) && (
                  <div style={{ marginLeft: '1.5rem', fontSize: '0.875rem' }}>
                    {item.text && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            fontWeight: '500',
                            marginBottom: '0.25rem',
                            color: '#646cff',
                          }}
                        >
                          Scripture Text:
                        </div>
                        <div
                          style={{
                            fontStyle: 'italic',
                            padding: '0.5rem',
                            background: 'rgba(100, 108, 255, 0.1)',
                            borderRadius: '4px',
                            borderLeft: '3px solid #646cff',
                          }}
                        >
                          {item.text}
                        </div>
                      </div>
                    )}

                    {item.textContent && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            fontWeight: '500',
                            marginBottom: '0.25rem',
                            color: '#10b981',
                          }}
                        >
                          Bible Verse:
                        </div>
                        <div
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '4px',
                            lineHeight: 1.4,
                          }}
                        >
                          {item.textContent}
                        </div>
                      </div>
                    )}

                    {item.explanation && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            fontWeight: '500',
                            marginBottom: '0.25rem',
                            color: '#f59e0b',
                          }}
                        >
                          Explanation:
                        </div>
                        <div
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '4px',
                            lineHeight: 1.4,
                          }}
                        >
                          {expandedTexts.has(index)
                            ? item.explanation
                            : truncateText(item.explanation, 200)}
                          {item.explanation && item.explanation.length > 200 && (
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f59e0b',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                marginLeft: '0.25rem',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newExpanded = new Set(expandedTexts);
                                if (newExpanded.has(index)) {
                                  newExpanded.delete(index);
                                } else {
                                  newExpanded.add(index);
                                }
                                setExpandedTexts(newExpanded);
                              }}
                            >
                              {expandedTexts.has(index) ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {item.reference && (
                      <div>
                        <div
                          style={{
                            fontWeight: '500',
                            marginBottom: '0.25rem',
                            color: '#8b5cf6',
                          }}
                        >
                          Reference:
                        </div>
                        <div
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.reference}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default JsonViewer;
