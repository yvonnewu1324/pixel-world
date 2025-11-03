import { Brick } from '../types'
import './Brick.css'
import KeyboardIcon from './KeyboardIcon'
import CookingIcon from './CookingIcon'

interface BrickProps {
  brick: Brick
}

function BrickComponent({ brick }: BrickProps) {
  return (
    <div
      className={`brick ${brick.hit ? 'hit' : ''} brick-${brick.type}`}
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

export default BrickComponent
