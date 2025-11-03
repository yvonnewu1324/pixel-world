import { memo, useEffect, useRef } from 'react'
import { Brick } from '../types'
import './Brick.css'
import KeyboardIcon from './KeyboardIcon'
import CookingIcon from './CookingIcon'

interface BrickProps {
  brick: Brick
}

function BrickComponent({ brick }: BrickProps) {
  const wasHitRef = useRef(false)
  const shouldAnimateRef = useRef(false)
  
  // Track if brick was just hit (transitions from false to true)
  useEffect(() => {
    if (brick.hit && !wasHitRef.current) {
      // Brick was just hit - trigger animation
      shouldAnimateRef.current = true
      wasHitRef.current = true
      // Reset animation flag after animation completes
      const timer = setTimeout(() => {
        shouldAnimateRef.current = false
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    } else if (brick.hit && wasHitRef.current) {
      // Brick was already hit - no animation
      shouldAnimateRef.current = false
    } else if (!brick.hit) {
      // Brick is not hit - reset state
      wasHitRef.current = false
      shouldAnimateRef.current = false
    }
  }, [brick.hit])
  
  return (
    <div
      className={`brick ${brick.hit ? 'hit' : ''} ${shouldAnimateRef.current ? 'hit-just' : ''} brick-${brick.type}`}
      style={{
        left: `${brick.position.x}px`,
        top: `${brick.position.y}px`,
      }}
    >
      <div className="brick-icon">
        {brick.type === 'education' && <i className="hn hn-book-heart-solid"></i>}
        {brick.type === 'experience' && <i className="hn hn-business"></i>}
        {brick.type === 'projects' && <i className="hn hn-code-solid"></i>}
        {brick.type === 'skills' && <i className="hn hn-cog-solid"></i>}
        {brick.type === 'contact' && <i className="hn hn-user"></i>}
        {brick.type === 'keyboard' && <KeyboardIcon />}
        {brick.type === 'music' && <i className="hn hn-headphones-solid"></i>}
        {brick.type === 'cooking' && <CookingIcon />}
      </div>
      {!brick.hit && <div className="question-mark">?</div>}
    </div>
  )
}

export default memo(BrickComponent)
