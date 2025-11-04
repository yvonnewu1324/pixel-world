import { memo, useEffect, useRef } from 'react'
import { Player, Brick } from '../types'
import BrickComponent from './Brick'
import PlayerComponent from './Player'
import Pipe from './Pipe'
import './GameCanvas.css'

interface GameCanvasProps {
  player: Player
  bricks: Brick[]
  pipePosition: { x: number; y: number }
  gameWidth: number
  gameHeight: number
  isMobilePortrait: boolean
}

function GameCanvas({ player, bricks, pipePosition, gameWidth, gameHeight, isMobilePortrait }: GameCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  // Auto-focus the canvas when it mounts so it can receive keyboard events
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.focus()
    }
  }, [])

  return (
    <div 
      ref={canvasRef}
      className={`game-canvas ${player.isUnderground ? 'game-canvas--underground' : ''} ${isMobilePortrait ? 'game-canvas--mobile-portrait' : ''}`}
      style={{
        width: `${gameWidth}px`,
        height: `${gameHeight}px`,
      }}
      tabIndex={0}
    >
      {!player.isUnderground && (
        <>
          <div className="instructions">
            <p className="desktop-instructions">USE ARROW KEYS OR WASD TO MOVE</p>
            <p className="mobile-instructions">USE VIRTUAL CONTROLS TO MOVE</p>
            <p>HIT BRICKS FROM BELOW!</p>
            <p>SQUAT AT THE PIPE TO GO UNDERGROUND!</p>
          </div>
          <div className="ground"></div>
          {bricks.map(brick => (
            <BrickComponent key={brick.id} brick={brick} isMobilePortrait={isMobilePortrait} />
          ))}
        </>
      )}
      
      {player.isUnderground && (
        <>
          <div className="instructions">
            <p>UNDERGROUND AREA</p>
            <p>SQUAT AT THE PIPE TO RETURN!</p>
          </div>
          <div className="ground ground--underground"></div>
          {bricks.map(brick => (
            <BrickComponent key={brick.id} brick={brick} isMobilePortrait={isMobilePortrait} />
          ))}
        </>
      )}

      <Pipe
        position={pipePosition}
        isUnderground={player.isUnderground}
        isMobilePortrait={isMobilePortrait}
      />
      <PlayerComponent player={player} isMobilePortrait={isMobilePortrait} />
    </div>
  )
}

export default memo(GameCanvas)
