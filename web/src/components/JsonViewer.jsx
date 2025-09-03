import React, { useState, useCallback, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Calendar,
  FileText,
  Hash,
  Copy,
  Check,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Link2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

function JsonViewer({ data }) {
  const [expandedItems, setExpandedItems] = useState(['item-0', 'item-1', 'item-2']);
  const [expandedTexts, setExpandedTexts] = useState(new Set());
  const [copyStatus, setCopyStatus] = useState('idle');
  const timeoutRef = useRef(null);

  const toggleExpandedText = (index) => {
    const newExpanded = new Set(expandedTexts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTexts(newExpanded);
  };

  const expandAll = () => {
    setExpandedItems(data.map((_, index) => `item-${index}`));
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  const formatDate = (dateStr) => {
    try {
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

  const copyToClipboard = useCallback(async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }

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
    if (copyStatus === 'copying') return;

    setCopyStatus('copying');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const success = await copyToClipboard(jsonString);

      setCopyStatus(success ? 'success' : 'error');

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

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>JSON Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No data to display</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">JSON Results</CardTitle>
            <CardDescription className="mt-1">Extracted daily texts from EPUB file</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              <Hash className="mr-1 h-3 w-3" />
              {data.length} entries
            </Badge>
            <Badge variant="outline" className="font-mono">
              <FileText className="mr-1 h-3 w-3" />
              {Math.round(JSON.stringify(data).length / 1024)} KB
            </Badge>
          </div>
        </div>
        {data[0]?.date && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(data[0].date)} — {formatDate(data[data.length - 1]?.date)}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="raw">
              <FileText className="h-4 w-4 mr-2" />
              Raw JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4 space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <Eye className="mr-2 h-4 w-4" />
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <EyeOff className="mr-2 h-4 w-4" />
                Collapse All
              </Button>
            </div>

            <ScrollArea className="h-[600px] rounded-md border p-4">
              <Accordion
                type="multiple"
                value={expandedItems}
                onValueChange={setExpandedItems}
                className="w-full"
              >
                {data.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.date}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="space-y-4 pt-4">
                      {item.text && (
                        <Card className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                              <BookOpen className="h-4 w-4" />
                              Scripture Text
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm italic">{item.text}</p>
                          </CardContent>
                        </Card>
                      )}

                      {item.textContent && (
                        <Card className="border-l-4 border-l-green-500">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                              <BookOpen className="h-4 w-4" />
                              Bible Verse
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed">{item.textContent}</p>
                          </CardContent>
                        </Card>
                      )}

                      {item.explanation && (
                        <Card className="border-l-4 border-l-amber-500">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                              <MessageSquare className="h-4 w-4" />
                              Explanation
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Collapsible open={expandedTexts.has(index)}>
                              <p className="text-sm leading-relaxed">
                                {expandedTexts.has(index)
                                  ? item.explanation
                                  : truncateText(item.explanation, 200)}
                              </p>
                              {item.explanation.length > 200 && (
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-auto p-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandedText(index);
                                    }}
                                  >
                                    {expandedTexts.has(index) ? (
                                      <>
                                        <ChevronDown className="mr-1 h-3 w-3" />
                                        Show less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="mr-1 h-3 w-3" />
                                        Show more
                                      </>
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </Collapsible>
                          </CardContent>
                        </Card>
                      )}

                      {item.reference && (
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <Badge variant="secondary" className="font-mono text-xs">
                            {item.reference}
                          </Badge>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                variant={
                  copyStatus === 'success'
                    ? 'default'
                    : copyStatus === 'error'
                      ? 'destructive'
                      : 'outline'
                }
                size="sm"
                onClick={handleCopyJson}
                disabled={copyStatus === 'copying'}
                className={cn(
                  'transition-all duration-200',
                  copyStatus === 'success' && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {copyStatus === 'idle' && <Copy className="mr-2 h-4 w-4" />}
                {copyStatus === 'copying' && <Copy className="mr-2 h-4 w-4 animate-pulse" />}
                {copyStatus === 'success' && <Check className="mr-2 h-4 w-4" />}
                {copyStatus === 'error' && <AlertCircle className="mr-2 h-4 w-4" />}
                {copyStatus === 'idle' && 'Copy JSON'}
                {copyStatus === 'copying' && 'Copying...'}
                {copyStatus === 'success' && 'Copied!'}
                {copyStatus === 'error' && 'Failed'}
              </Button>
            </div>

            <ScrollArea className="h-[600px] rounded-md border">
              <pre className="p-4 text-sm">
                <code className="language-json">{JSON.stringify(data, null, 2)}</code>
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default JsonViewer;
