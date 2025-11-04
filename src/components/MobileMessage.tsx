import { useState, useEffect } from 'react'
import './MobileMessage.css'

function MobileMessage() {
  const [isMobile, setIsMobile] = useState(false)

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

  // No longer blocking - just return null (or could show a helpful tip if needed)
  return null
}

export default MobileMessage

