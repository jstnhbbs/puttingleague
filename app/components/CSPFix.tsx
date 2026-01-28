'use client'

import { useEffect } from 'react'

/**
 * Client component to inject CSP meta tag if it doesn't exist
 * This helps with GitHub Pages CSP restrictions
 */
export function CSPFix() {
  useEffect(() => {
    // Check if CSP meta tag already exists
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    
    if (!existingCSP) {
      // Create and inject CSP meta tag
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = "img-src 'self' data: https:; default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:;"
      document.head.appendChild(meta)
    }
  }, [])

  return null
}
