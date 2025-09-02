import { useState, useEffect, useCallback } from 'react'

export function useEpubProcessor() {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [eventSource, setEventSource] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  
  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
        setEventSource(null)
      }
    }
  }, [eventSource])
  
  // Fetch result data for preview
  const fetchResultData = useCallback(async (resultId, progressYear) => {
    try {
      const response = await fetch(`/api/download/${resultId}`)
      if (response.ok) {
        const data = await response.json()
        // Extract year from the actual data - this should be the source of truth
        const yearFromData = data && data.length > 0 ? data[0].date.substring(0, 4) : null
        setResult(prev => ({ 
          ...prev, 
          data,
          year: yearFromData || progressYear || prev?.year
        }))
      }
    } catch (error) {
      console.error('Error fetching result data:', error)
      // Don't set error state as the main processing succeeded
    }
  }, [])
  
  const processFile = useCallback(async (file) => {
    // Generate a new sessionId for each file upload
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    
    // Clear all previous state completely before starting
    setProcessing(true)
    setError(null)
    setResult(null)
    setProgress({ 
      status: 'processing',
      progress: 0, 
      message: 'Starting...', 
      filename: file.name,
      startTime: Date.now()
    })
    
    try {
      // Set up Server-Sent Events for real-time progress
      const es = new EventSource(`/api/events/${newSessionId}`)
      setEventSource(es)
      
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE Event:', data)
          
          if (data.type === 'progress') {
            setProgress(data)
            
            if (data.status === 'completed') {
              setProcessing(false)
              setResult({
                year: data.year,
                count: data.count,
                resultId: data.resultId,
                data: [] // Will be populated when we fetch the result
              })
              es.close()
              setEventSource(null)
              
              // Fetch the actual result data for preview
              if (data.resultId) {
                fetchResultData(data.resultId, data.year)
              }
            } else if (data.status === 'error') {
              setProcessing(false)
              setError(data.error)
              es.close()
              setEventSource(null)
            }
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError)
        }
      }
      
      es.onerror = (error) => {
        console.error('SSE Error:', error)
        es.close()
        setEventSource(null)
        
        // Fall back to polling if SSE fails
        if (processing) {
          pollProgress()
        }
      }
      
      // Upload file and start processing
      const formData = new FormData()
      formData.append('epub', file)
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Session-ID': newSessionId
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Processing failed')
      }
      
      const data = await response.json()
      console.log('Upload response:', data)
      
      // If processing completed immediately (unlikely but possible)
      if (data.status === 'completed') {
        setProcessing(false)
        setResult(data)
        es.close()
        setEventSource(null)
      }
      
    } catch (err) {
      console.error('Processing error:', err)
      setProcessing(false)
      setError(err.message)
      if (eventSource) {
        eventSource.close()
        setEventSource(null)
      }
      throw err
    }
  }, [fetchResultData])
  
  // Fallback polling function if SSE fails
  const pollProgress = useCallback(() => {
    // This would require storing the jobId from the upload response
    // For now, we'll rely on SSE
  }, [])
  
  const downloadResult = useCallback(async () => {
    if (!result?.resultId) return
    
    try {
      const response = await fetch(`/api/download/${result.resultId}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `daily-texts-${result.year}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('Download completed')
    } catch (err) {
      console.error('Download error:', err)
      setError('Download failed: ' + err.message)
    }
  }, [result])
  
  const reset = useCallback(() => {
    setProcessing(false)
    setProgress(null)
    setResult(null)
    setError(null)
    
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
    }
  }, [eventSource])
  
  return {
    processing,
    progress,
    result,
    error,
    processFile,
    downloadResult,
    reset
  }
}