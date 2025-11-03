import { useEffect, useRef } from 'react'
import { Player, Brick } from '../types'
import BrickComponent from './Brick'
import PlayerComponent from './Player'
import Pipe from './Pipe'
import './GameCanvas.css'

interface GameCanvasProps {
  player: Player
  bricks: Brick[]
  pipePosition: { x: number; y: number }
}

function GameCanvas({ player, bricks, pipePosition }: GameCanvasProps) {
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
      className={`game-canvas ${player.isUnderground ? 'game-canvas--underground' : ''}`}
      tabIndex={0}
    >
      {!player.isUnderground && (
        <>
          <div className="instructions">
            <p>USE ARROW KEYS OR WASD TO MOVE</p>
            <p>HIT BRICKS FROM BELOW!</p>
            <p>SQUAT AT THE PIPE TO GO UNDERGROUND!</p>
          </div>
          <div className="ground"></div>
          {bricks.map(brick => (
            <BrickComponent key={brick.id} brick={brick} />
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
            <BrickComponent key={brick.id} brick={brick} />
          ))}
        </>
      )}

      <Pipe
        position={pipePosition}
        isUnderground={player.isUnderground}
      />
      <PlayerComponent player={player} />
    </div>
  )
}

export default GameCanvas
