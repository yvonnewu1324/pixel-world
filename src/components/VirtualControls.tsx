import { useState, useEffect, useRef } from 'react'
import './VirtualControls.css'

interface VirtualControlsProps {
  onKeyDown: (key: string) => void
  onKeyUp: (key: string) => void
}

function VirtualControls({ onKeyDown, onKeyUp }: VirtualControlsProps) {
  const [isMobile, setIsMobile] = useState(false)
  const activeKeysRef = useRef<Set<string>>(new Set())

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

  const handleTouchStart = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    if (!activeKeysRef.current.has(key)) {
      activeKeysRef.current.add(key)
      onKeyDown(key)
    }
  }

  const handleTouchEnd = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    if (activeKeysRef.current.has(key)) {
      activeKeysRef.current.delete(key)
      onKeyUp(key)
    }
  }

  const handleTouchCancel = (key: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    if (activeKeysRef.current.has(key)) {
      activeKeysRef.current.delete(key)
      onKeyUp(key)
    }
  }

  if (!isMobile) {
    return null
  }

  return (
    <div className="virtual-controls">
      <div className="virtual-controls-row">
        {/* Left and Right buttons */}
        <div className="virtual-controls-group">
          <button
            className="virtual-button virtual-button-left"
            onTouchStart={handleTouchStart('ArrowLeft')}
            onTouchEnd={handleTouchEnd('ArrowLeft')}
            onTouchCancel={handleTouchCancel('ArrowLeft')}
            aria-label="Move Left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="virtual-button virtual-button-right"
            onTouchStart={handleTouchStart('ArrowRight')}
            onTouchEnd={handleTouchEnd('ArrowRight')}
            onTouchCancel={handleTouchCancel('ArrowRight')}
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
            className="virtual-button virtual-button-up"
            onTouchStart={handleTouchStart('ArrowUp')}
            onTouchEnd={handleTouchEnd('ArrowUp')}
            onTouchCancel={handleTouchCancel('ArrowUp')}
            aria-label="Jump"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="virtual-button virtual-button-down"
            onTouchStart={handleTouchStart('ArrowDown')}
            onTouchEnd={handleTouchEnd('ArrowDown')}
            onTouchCancel={handleTouchCancel('ArrowDown')}
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

