'use client'

import { useEffect, ReactNode } from 'react'

interface ContentProtectionProps {
  children: ReactNode
  className?: string
}

export default function ContentProtection({ children, className = '' }: ContentProtectionProps) {
  useEffect(() => {
    // Disable right-click context menu
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable common copy shortcuts
    const disableCopyShortcuts = (e: KeyboardEvent) => {
      // Disable Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+V (Paste)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+X (Cut)
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        return false
      }
      
      // Disable F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        return false
      }
      
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        return false
      }
    }

    // Disable drag and drop
    const disableDragDrop = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    // Disable text selection programmatically
    const disableSelection = (e: Event) => {
      e.preventDefault()
      return false
    }

    // Clear clipboard if copy is attempted
    const clearClipboard = async () => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText('')
        }
      } catch (err) {
        // Clipboard access denied, which is fine
      }
    }

    // Add event listeners
    document.addEventListener('contextmenu', disableRightClick)
    document.addEventListener('keydown', disableCopyShortcuts)
    document.addEventListener('dragstart', disableDragDrop)
    document.addEventListener('drop', disableDragDrop)
    document.addEventListener('selectstart', disableSelection)
    document.addEventListener('copy', clearClipboard)

    // Disable print screen (limited effectiveness)
    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        clearClipboard()
      }
    })

    // Basic DevTools detection
    let devtools = { open: false, orientation: null }
    const threshold = 160

    const detectDevTools = () => {
      // TEMPORARILY DISABLED FOR DEBUGGING
      // Uncomment this code when ready to re-enable developer tools protection
      /*
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true
          // Redirect or show warning when dev tools detected
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;"><div><h1>⚠️ Access Restricted</h1><p>Developer tools detected. Please close them to continue reading.</p></div></div>'
        }
      } else {
        devtools.open = false
      }
      */
    }

    // Check for dev tools every 500ms
    // TEMPORARILY DISABLED FOR DEBUGGING
    // const devToolsInterval = setInterval(detectDevTools, 500)

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', disableRightClick)
      document.removeEventListener('keydown', disableCopyShortcuts)
      document.removeEventListener('dragstart', disableDragDrop)
      document.removeEventListener('drop', disableDragDrop)
      document.removeEventListener('selectstart', disableSelection)
      document.removeEventListener('copy', clearClipboard)
      // clearInterval(devToolsInterval)
    }
  }, [])

  return (
    <div
      className="relative"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        // Use a CSS variable for WebkitUserDrag
        ...({ WebkitUserDrag: 'none' } as any),
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {children}
      </div>
    </div>
  )
} 
