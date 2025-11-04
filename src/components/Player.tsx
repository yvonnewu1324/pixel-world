import { memo } from 'react'
import { Player } from '../types'
import './Player.css'

interface PlayerProps {
  player: Player
  isMobilePortrait?: boolean
}

function PlayerComponent({ player, isMobilePortrait = false }: PlayerProps) {
  // Determine animation state
  const isMoving = player.velocity.x !== 0
  const isJumping = player.isJumping
  const isSquatting = player.isSquatting

  let animationClass = 'hero--idle'
  if (player.pipeAnimation === 'entering') {
    animationClass = 'hero--idle'
  } else if (isJumping) {
    animationClass = 'hero--jump'
  } else if (isSquatting) {
    animationClass = 'hero--squat'
  } else if (isMoving) {
    animationClass = 'hero--walk'
  }

  // Determine pipe animation class
  let pipeAnimationClass = ''
  if (player.pipeAnimation === 'entering') {
    pipeAnimationClass = 'player--entering-pipe'
  } else if (player.pipeAnimation === 'exiting') {
    pipeAnimationClass = 'player--exiting-pipe'
  } else if (player.pipeAnimation === 'transitioning') {
    pipeAnimationClass = 'player--transitioning'
  }

  const inPipeClass = player.pipeAnimation !== 'none' ? 'player--in-pipe' : ''

  return (
    <div
      className={`player ${player.direction === 'left' ? 'face-left' : ''} ${pipeAnimationClass} ${inPipeClass} ${isMobilePortrait ? 'player--mobile' : ''}`}
      style={{
        left: `${player.position.x}px`,
        top: `${player.position.y}px`,
      }}
    >
      <div className={`sprite ${animationClass}`}></div>
    </div>
  )
}

export default memo(PlayerComponent)
