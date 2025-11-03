import './Pipe.css'

interface PipeProps {
  position: { x: number; y: number }
  isUnderground?: boolean
}

function Pipe({ position, isUnderground = false }: PipeProps) {
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

export default Pipe
