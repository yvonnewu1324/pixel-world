import { memo } from 'react'
import './Pipe.css'

interface PipeProps {
  position: { x: number; y: number }
  isUnderground?: boolean
  isMobilePortrait?: boolean
  groundY?: number
  canvasHeight?: number
}

function Pipe({ position, isUnderground = false }: PipeProps) {
  // Always use top positioning for consistency with collision detection
  // position.y is calculated to align pipe bottom with GROUND_Y for mobile
  return (
    <div 
      className={`pipe ${isUnderground ? 'pipe--underground' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <img src="/pipe.png" alt="Pipe" className="pipe-image pipe-image--body" />
      <img src="/pipe.png" aria-hidden="true" className="pipe-image pipe-image--lip" />
    </div>
  )
}

export default memo(Pipe)
