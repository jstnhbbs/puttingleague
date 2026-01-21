'use client'

import { useEffect, useState } from 'react'

interface SheetIframeProps {
  src: string
  title: string
  className?: string
}

export function SheetIframe({ src, title, className }: SheetIframeProps) {
  const [iframeSrc, setIframeSrc] = useState(src)

  useEffect(() => {
    // Add cache-busting parameter on mount and when src changes
    const separator = src.includes('?') ? '&' : '?'
    const timestamp = Date.now()
    setIframeSrc(`${src}${separator}_=${timestamp}`)
  }, [src])

  return (
    <iframe
      src={iframeSrc}
      className={className}
      title={title}
      key={iframeSrc} // Force re-render when src changes
    />
  )
}
