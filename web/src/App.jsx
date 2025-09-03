import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import JsonViewer from './components/JsonViewer';
import { useEpubProcessor } from './hooks/useEpubProcessor';
import { BookOpen, Github, Download, RotateCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Daily Text EPUB to JSON</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Convert JW daily text EPUB files to structured JSON format
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {view === 'upload' && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Upload EPUB File</CardTitle>
                <CardDescription>
                  Select a Spanish daily text EPUB file to convert to JSON format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileSelect={handleFileSelect} disabled={processing} error={error} />
              </CardContent>
            </Card>
          )}

          {view === 'processing' && <ProcessingStatus progress={progress} onCancel={handleReset} />}

          {view === 'result' && result && (
            <>
              <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Processing Complete!</CardTitle>
                  <CardDescription>
                    Your EPUB file has been successfully converted to JSON format
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Successfully processed {result.count} daily texts for year {result.year}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{result.year}</div>
                          <p className="text-sm text-muted-foreground mt-1">Year</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{result.count}</div>
                          <p className="text-sm text-muted-foreground mt-1">Daily Texts</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleDownload} size="lg" className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Download JSON
                    </Button>
                    <Button
                      onClick={handleReset}
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      <RotateCw className="mr-2 h-4 w-4" />
                      Process Another File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <JsonViewer data={result.data} />
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 pb-6">
          <Separator className="mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                v2.0.0
              </Badge>
              <span>Daily Text EPUB to JSON Converter</span>
            </div>
            <Button variant="ghost" size="sm" asChild className="hover:text-primary">
              <a
                href="https://github.com/jjuanrivvera/daily-text-epub-to-json"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
