import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2, FileUp, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function FileUpload({ onFileSelect, disabled, error }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragError, setDragError] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      setDragError(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorMessage = rejection.errors[0]?.message || 'File rejected';
        setDragError(errorMessage);
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/epub+zip': ['.epub'],
      'application/zip': ['.zip'],
    },
    maxFiles: 1,
    disabled,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setDragError(null);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative group cursor-pointer',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />

        <Card
          className={cn(
            'border-2 border-dashed transition-all duration-200',
            !isDragActive &&
              !selectedFile &&
              !error &&
              !dragError &&
              'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50',
            isDragActive && !isDragReject && 'border-primary bg-primary/5',
            (isDragReject || error || dragError) && 'border-destructive bg-destructive/5',
            selectedFile && !error && !dragError && 'border-primary bg-primary/5'
          )}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {isDragActive && !isDragReject ? (
                <>
                  <div className="rounded-full bg-primary/10 p-4 animate-pulse">
                    <FileUp className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium">Drop your file here</p>
                    <p className="text-sm text-muted-foreground">Release to upload</p>
                  </div>
                </>
              ) : isDragReject ? (
                <>
                  <div className="rounded-full bg-destructive/10 p-4">
                    <X className="h-10 w-10 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-destructive">Invalid file type</p>
                    <p className="text-sm text-muted-foreground">Only EPUB files are accepted</p>
                  </div>
                </>
              ) : selectedFile ? (
                <>
                  <div className="rounded-full bg-primary/10 p-4">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium break-all">{selectedFile.name}</p>
                    <div className="flex items-center gap-2 justify-center">
                      <Badge variant="secondary">{formatFileSize(selectedFile.size)}</Badge>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                    {!disabled && (
                      <Button variant="ghost" size="sm" onClick={clearSelection} className="mt-2">
                        <X className="h-4 w-4 mr-1" />
                        Clear selection
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-4 group-hover:bg-muted/80 transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium">Upload EPUB file</p>
                    <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        .epub
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        .zip
                      </Badge>
                    </div>
                    <span>Max 50 MB</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {(error || dragError) && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || dragError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default FileUpload;
