import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

function FileUpload({ onFileSelect, disabled, error }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragError, setDragError] = useState(null)
  
  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setDragError(null)
    
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0]
      const errorMessage = rejection.errors[0]?.message || 'File rejected'
      setDragError(errorMessage)
      return
    }
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [onFileSelect])
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/epub+zip': ['.epub'],
      'application/zip': ['.zip']
    },
    maxFiles: 1,
    disabled,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  })
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const dropzoneStyle = {
    border: '2px dashed',
    borderRadius: '12px',
    padding: '3rem 2rem',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    borderColor: isDragReject || error || dragError 
      ? '#ef4444' 
      : isDragActive 
        ? '#646cff' 
        : selectedFile 
          ? '#10b981'
          : 'rgba(255, 255, 255, 0.3)',
    backgroundColor: isDragReject || error || dragError
      ? 'rgba(239, 68, 68, 0.1)'
      : isDragActive
        ? 'rgba(100, 108, 255, 0.1)'
        : selectedFile
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(255, 255, 255, 0.05)',
    opacity: disabled ? 0.6 : 1
  }
  
  return (
    <div>
      <div {...getRootProps()} style={dropzoneStyle}>
        <input {...getInputProps()} />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {isDragActive ? (
            <>
              <Upload size={48} color="#646cff" />
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                Drop the EPUB file here...
              </p>
            </>
          ) : selectedFile ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={48} color="#10b981" />
                <FileText size={32} color="#10b981" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                  {selectedFile.name}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7 }}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                Ready to process • Click to select a different file
              </p>
            </>
          ) : (
            <>
              <Upload size={48} color={disabled ? '#666' : 'rgba(255, 255, 255, 0.6)'} />
              <div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                  Drag & drop an EPUB file here
                </p>
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.7 }}>
                  or click to select a file
                </p>
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                opacity: 0.6,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <span>Supported formats: .epub, .zip</span>
                <span>Maximum size: 50 MB</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {(error || dragError) && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444'
        }}>
          <AlertCircle size={20} />
          <span>{error || dragError}</span>
        </div>
      )}
      
      {selectedFile && !error && !dragError && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          opacity: 0.8
        }}>
          File selected successfully. Processing will begin automatically.
        </div>
      )}
    </div>
  )
}

export default FileUpload