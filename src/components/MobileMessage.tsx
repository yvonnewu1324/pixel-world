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

  if (!isMobile) {
    return null
  }

  return (
    <div className="mobile-message-overlay">
      <div className="mobile-message-content">
        <div className="laptop-icon">💻</div>
        <h2>Large Screen Required</h2>
        <p>This website is designed for larger screens such as laptops or desktop computers.</p>
        <p className="hint">Please open this website on a device with a larger screen to play and explore my portfolio!</p>
      </div>
    </div>
  )
}

export default MobileMessage

