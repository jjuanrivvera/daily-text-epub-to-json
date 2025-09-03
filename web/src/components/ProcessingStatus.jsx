import React from 'react';
import { Loader2, X, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function ProcessingStatus({ progress, onCancel }) {
  if (!progress) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Initializing...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (progress.status === 'error') {
      return <AlertCircle className="h-16 w-16 text-destructive" />;
    }
    if (progress.status === 'completed') {
      return <CheckCircle className="h-16 w-16 text-green-600" />;
    }
    return <Loader2 className="h-16 w-16 text-primary animate-spin" />;
  };

  const getProgressColor = () => {
    if (progress.status === 'error') return 'bg-destructive';
    if (progress.status === 'completed') return 'bg-green-600';
    return 'bg-primary';
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">{getStatusIcon()}</div>
        <CardTitle>
          {progress.status === 'error' && 'Processing Failed'}
          {progress.status === 'completed' && 'Processing Complete!'}
          {progress.status === 'processing' && 'Processing EPUB File'}
        </CardTitle>
        {progress.filename && (
          <CardDescription className="flex items-center justify-center gap-2 mt-2">
            <FileText className="h-4 w-4" />
            <span className="truncate max-w-xs">{progress.filename}</span>
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(progress.status === 'processing' || progress.progress !== undefined) && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{progress.message || 'Processing...'}</span>
              <Badge variant="secondary">{Math.round(progress.progress || 0)}%</Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300 ease-out rounded-full',
                  getProgressColor()
                )}
                style={{ width: `${progress.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Stage Information */}
        {progress.status === 'processing' && progress.stage && (
          <Alert className="border-primary/20 bg-primary/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Current Stage</AlertTitle>
            <AlertDescription>
              {progress.stage}
              {progress.currentFile && progress.totalFiles && (
                <span className="block mt-1">
                  Processing file {progress.currentFile} of {progress.totalFiles}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Start Time */}
        {progress.startTime && progress.status === 'processing' && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Started at {new Date(progress.startTime).toLocaleTimeString()}</span>
          </div>
        )}

        {/* Success Message */}
        {progress.status === 'completed' && progress.count && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-100">Success!</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              Successfully extracted {progress.count} daily texts for year {progress.year}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {progress.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {progress.error || 'An unexpected error occurred during processing'}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-center">
          {progress.status === 'processing' ? (
            <Button variant="outline" onClick={onCancel} className="min-w-[140px]">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <Button
              variant={progress.status === 'error' ? 'destructive' : 'default'}
              onClick={onCancel}
              className="min-w-[180px]"
            >
              {progress.status === 'error' ? 'Try Again' : 'Process Another File'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProcessingStatus;
