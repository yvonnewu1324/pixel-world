import { useState, useEffect, useRef } from 'react'
import './VirtualControls.css'

interface VirtualControlsProps {
  onKeyDown: (key: string) => void
  onKeyUp: (key: string) => void
}

function VirtualControls({ onKeyDown, onKeyUp }: VirtualControlsProps) {
  const [isMobile, setIsMobile] = useState(false)
  const activeKeysRef = useRef<Set<string>>(new Set())
  const controlsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                             (window.innerWidth <= 768 && 'ontouchstart' in window)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Set up native touch event listeners with passive: false
  useEffect(() => {
    if (!isMobile || !controlsRef.current) return

    const buttons = controlsRef.current.querySelectorAll<HTMLButtonElement>('[data-key]')
    const cleanupFunctions: Array<() => void> = []

    buttons.forEach(button => {
      const key = button.dataset.key!
      
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault()
        if (!activeKeysRef.current.has(key)) {
          activeKeysRef.current.add(key)
          onKeyDown(key)
        }
      }

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault()
        if (activeKeysRef.current.has(key)) {
          activeKeysRef.current.delete(key)
          onKeyUp(key)
        }
      }

      const handleTouchCancel = (e: TouchEvent) => {
        e.preventDefault()
        if (activeKeysRef.current.has(key)) {
          activeKeysRef.current.delete(key)
          onKeyUp(key)
        }
      }

      button.addEventListener('touchstart', handleTouchStart, { passive: false })
      button.addEventListener('touchend', handleTouchEnd, { passive: false })
      button.addEventListener('touchcancel', handleTouchCancel, { passive: false })

      cleanupFunctions.push(() => {
        button.removeEventListener('touchstart', handleTouchStart)
        button.removeEventListener('touchend', handleTouchEnd)
        button.removeEventListener('touchcancel', handleTouchCancel)
      })
    })

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [isMobile, onKeyDown, onKeyUp])

  if (!isMobile) {
    return null
  }

  return (
    <div ref={controlsRef} className="virtual-controls">
      <div className="virtual-controls-row">
        {/* Left and Right buttons */}
        <div className="virtual-controls-group">
          <button
            data-key="ArrowLeft"
            className="virtual-button virtual-button-left"
            aria-label="Move Left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            data-key="ArrowRight"
            className="virtual-button virtual-button-right"
            aria-label="Move Right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Up and Down buttons */}
        <div className="virtual-controls-group virtual-controls-group-vertical">
          <button
            data-key="ArrowUp"
            className="virtual-button virtual-button-up"
            aria-label="Jump"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            data-key="ArrowDown"
            className="virtual-button virtual-button-down"
            aria-label="Squat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default VirtualControls

