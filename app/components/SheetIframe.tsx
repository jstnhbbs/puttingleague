'use client'

import { useEffect, useState, useRef } from 'react'

interface SheetIframeProps {
  src: string
  title: string
  className?: string
}

function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${url}${separator}_=${timestamp}&r=${random}`
}

export function SheetIframe({ src, title, className }: SheetIframeProps) {
  const [iframeSrc, setIframeSrc] = useState(() => addCacheBuster(src))
  const [refreshKey, setRefreshKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Force refresh on every mount and when src changes
    const newSrc = addCacheBuster(src)
    setIframeSrc(newSrc)
    setRefreshKey(prev => prev + 1)

    // Force iframe reload if it exists
    if (iframeRef.current) {
      iframeRef.current.src = ''
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = newSrc
        }
      }, 0)
    }
  }, [src])

  // Force refresh on visibility change and page focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && iframeRef.current) {
        const newSrc = addCacheBuster(src)
        setIframeSrc(newSrc)
        iframeRef.current.src = newSrc
      }
    }

    const handleFocus = () => {
      if (iframeRef.current) {
        const newSrc = addCacheBuster(src)
        setIframeSrc(newSrc)
        iframeRef.current.src = newSrc
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [src])

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      className={className}
      title={title}
      key={`${src}-${refreshKey}`} // Force re-render with unique key
    />
  )
}
