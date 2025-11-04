import { Player, Brick } from '../types'

export interface GameConstants {
  gameWidth: number
  gameHeight: number
  PLAYER_GROUND_Y: number
  PLAYER_WIDTH: number
  PLAYER_HEIGHT: number
  BRICK_SIZE: number
  PIPE_BOX: {
    left: number
    right: number
    top: number
    bottom: number
  }
  PIPE_TOP_Y: number
  getPipeCenterX: (direction: 'left' | 'right') => number
}

export interface GameCallbacks {
  onPlayerUpdate: (player: Player) => void
  onBrickHit: (brick: Brick) => void
  onPipeTravel: (currentIsUnderground: boolean) => boolean
  getBricks: () => Brick[]
  getSelectedBrick: () => Brick | null
  getPipeAnimation: () => Player['pipeAnimation']
  getPlayer: () => Player
}

export class PlayerPhysics {
  private player: Player
  private keys: Set<string> = new Set()
  private gameConstants: GameConstants
  private callbacks: GameCallbacks
  private isMobilePortrait: boolean
  private animationFrameId: number | null = null
  private lastTime: number = performance.now()
  private readonly targetFPS = 60
  private readonly frameInterval = 1000 / this.targetFPS

  constructor(
    initialPlayer: Player,
    gameConstants: GameConstants,
    callbacks: GameCallbacks,
    isMobilePortrait: boolean
  ) {
    this.player = { ...initialPlayer }
    this.gameConstants = gameConstants
    this.callbacks = callbacks
    this.isMobilePortrait = isMobilePortrait
  }

  setKeys(keys: Set<string>): void {
    this.keys = keys
  }

  updateConstants(gameConstants: GameConstants): void {
    this.gameConstants = gameConstants
  }

  updateMobilePortrait(isMobilePortrait: boolean): void {
    this.isMobilePortrait = isMobilePortrait
  }

  updatePlayer(player: Player): void {
    this.player = { ...player }
  }

  start(): void {
    if (this.animationFrameId !== null) {
      return // Already running
    }
    this.lastTime = performance.now()
    this.gameLoop()
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    if (deltaTime >= this.frameInterval) {
      this.lastTime = currentTime - (deltaTime % this.frameInterval)
      this.update()
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  private update(): void {
    // Get current pipe animation state
    const pipeAnimation = this.callbacks.getPipeAnimation()

    // During pipe animations, sync full player state from React
    // Don't call onPlayerUpdate here - React manages state during pipe animations
    if (pipeAnimation !== 'none') {
      const reactPlayer = this.callbacks.getPlayer()
      // Sync internal state with React's state (including isUnderground)
      this.player = { ...reactPlayer }
      return
    }

    // Normal physics update
    const prevPlayer = { ...this.player }
    let newVelocity = { ...prevPlayer.velocity }
    let newPosition = { ...prevPlayer.position }
    let newDirection = prevPlayer.direction
    let newIsJumping = prevPlayer.isJumping
    let newIsSquatting = false
    let newIsUnderground = prevPlayer.isUnderground

    // Disable movement when modal is open
    const selectedBrick = this.callbacks.getSelectedBrick()
    if (selectedBrick) {
      newVelocity.x = 0
      newVelocity.y += 0.8 // Still apply gravity
    } else {
      // Horizontal movement
      // Check for squat first (takes priority over horizontal movement when on ground)
      if ((this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) && !prevPlayer.isJumping) {
        newIsSquatting = true
        newVelocity.x = 0 // Can't move while squatting
      } else {
        if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
          newVelocity.x = -5
          newDirection = 'left'
        } else if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
          newVelocity.x = 5
          newDirection = 'right'
        } else {
          newVelocity.x = 0
        }
      }

      // Jump
      // Lower jump height for mobile (smaller screen, less space)
      const jumpVelocity = this.isMobilePortrait ? -17 : -18
      if ((this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W') || this.keys.has(' ')) && !prevPlayer.isJumping) {
        newVelocity.y = jumpVelocity
        newIsJumping = true
        newIsSquatting = false // Can't squat while jumping
      }
    }

    // Gravity
    newVelocity.y += 0.8

    // Update position
    newPosition.x += newVelocity.x
    newPosition.y += newVelocity.y

    // Player bounds
    const playerRight = newPosition.x + this.gameConstants.PLAYER_WIDTH
    const playerLeft = newPosition.x
    const playerTop = newPosition.y
    const playerBottom = newPosition.y + this.gameConstants.PLAYER_HEIGHT

    // Check if player is over the pipe horizontally
    const isOverPipeX = playerRight > this.gameConstants.PIPE_BOX.left && playerLeft < this.gameConstants.PIPE_BOX.right

    // Ground collision (stand at GROUND_Y)
    // Only apply ground collision if player is not on top of the pipe
    const isStandingOnPipe = isOverPipeX && Math.abs(newPosition.y - this.gameConstants.PIPE_TOP_Y) < 10 && pipeAnimation === 'none'

    if (newPosition.y >= this.gameConstants.PLAYER_GROUND_Y && !isStandingOnPipe && pipeAnimation === 'none') {
      newPosition.y = this.gameConstants.PLAYER_GROUND_Y
      newVelocity.y = 0
      newIsJumping = false
    }

    // Screen boundaries (fixed canvas coordinates)
    if (newPosition.x < 0) newPosition.x = 0
    if (newPosition.x > this.gameConstants.gameWidth - this.gameConstants.PLAYER_WIDTH) {
      newPosition.x = this.gameConstants.gameWidth - this.gameConstants.PLAYER_WIDTH
    }

    // Check if player is standing on top of the pipe
    const isOnPipeTop = Math.abs(newPosition.y - this.gameConstants.PIPE_TOP_Y) < 10 && isOverPipeX

    // Pipe entry logic - squat on pipe to enter
    if (newIsSquatting && isOnPipeTop && pipeAnimation === 'none') {
      const transitionStarted = this.callbacks.onPipeTravel(prevPlayer.isUnderground)

      if (transitionStarted) {
        // Don't update player state here - let React handle it via pipeState management
        // Just return early to stop physics processing for this frame
        // React's useEffect watching pipeState.phase will update the player state
        // Sync internal state with React's state on next frame via getPipeAnimation()
        return
      }
    }

    // Pipe collision - treat as solid platform
    if (pipeAnimation === 'none') {
      // Check if player is horizontally overlapping with pipe
      const isOverPipeXRange = playerRight > this.gameConstants.PIPE_BOX.left && playerLeft < this.gameConstants.PIPE_BOX.right

      // Check if player is close to pipe top position
      const distanceToPipeTop = Math.abs(newPosition.y - this.gameConstants.PIPE_TOP_Y)

      // If player is very close to pipe top and over the pipe, lock them there
      if (isOverPipeXRange && distanceToPipeTop < 8) {
        // Firmly lock position to prevent any jitter
        newPosition.y = this.gameConstants.PIPE_TOP_Y
        newVelocity.y = 0
        newIsJumping = false
      }
      // If player is falling down and approaching pipe top
      else if (isOverPipeXRange && newVelocity.y > 0 && distanceToPipeTop < 20) {
        // Check if player's bottom is near or past the pipe top
        if (playerBottom >= this.gameConstants.PIPE_BOX.top - 5 && playerBottom <= this.gameConstants.PIPE_BOX.top + 20) {
          newVelocity.y = 0
          newPosition.y = this.gameConstants.PIPE_TOP_Y
          newIsJumping = false
        }
      }

      // Handle side collisions only when player is NOT on top of pipe
      const isOnPipeTopNow = isOverPipeXRange && distanceToPipeTop < 8
      if (!isOnPipeTopNow && playerBottom > this.gameConstants.PIPE_BOX.top + 15) {
        const isPipeOverlapping =
          playerRight > this.gameConstants.PIPE_BOX.left &&
          playerLeft < this.gameConstants.PIPE_BOX.right &&
          playerBottom > this.gameConstants.PIPE_BOX.top &&
          playerTop < this.gameConstants.PIPE_BOX.bottom

        if (isPipeOverlapping) {
          const overlapLeft = playerRight - this.gameConstants.PIPE_BOX.left
          const overlapRight = this.gameConstants.PIPE_BOX.right - playerLeft

          // Push player away from pipe sides
          if (overlapLeft < overlapRight && overlapLeft < 15) {
            newVelocity.x = 0
            newPosition.x = this.gameConstants.PIPE_BOX.left - this.gameConstants.PLAYER_WIDTH
          } else if (overlapRight < overlapLeft && overlapRight < 15) {
            newVelocity.x = 0
            newPosition.x = this.gameConstants.PIPE_BOX.right
          }
        }
      }
    }

    // Brick collision detection
    // Early exit optimization: only check bricks near the player
    const playerCenterX = newPosition.x + this.gameConstants.PLAYER_WIDTH / 2
    const checkRadius = this.gameConstants.BRICK_SIZE * 2 // Only check bricks within 2x brick size

    const bricks = this.callbacks.getBricks()
    bricks.forEach(brick => {
      // Quick distance check to skip far-away bricks
      const brickCenterX = brick.position.x + this.gameConstants.BRICK_SIZE / 2
      const brickCenterY = brick.position.y + this.gameConstants.BRICK_SIZE / 2
      const dx = Math.abs(playerCenterX - brickCenterX)
      const dy = Math.abs((playerTop + playerBottom) / 2 - brickCenterY)

      if (dx > checkRadius || dy > checkRadius) {
        return // Skip this brick, it's too far away
      }

      const brickTop = brick.position.y
      const brickBottom = brick.position.y + this.gameConstants.BRICK_SIZE
      const brickLeft = brick.position.x
      const brickRight = brick.position.x + this.gameConstants.BRICK_SIZE

      // Check for collision overlap
      const isOverlapping =
        playerRight > brickLeft &&
        playerLeft < brickRight &&
        playerBottom > brickTop &&
        playerTop < brickBottom

      if (isOverlapping) {
        // Calculate overlap on each side
        const overlapLeft = playerRight - brickLeft
        const overlapRight = brickRight - playerLeft
        const overlapTop = playerBottom - brickTop
        const overlapBottom = brickBottom - playerTop

        // Find the smallest overlap to determine collision direction
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

        // Hit from below (trigger brick)
        if (minOverlap === overlapBottom && newVelocity.y < 0 && playerCenterX > brickLeft && playerCenterX < brickRight) {
          this.callbacks.onBrickHit(brick)
          newVelocity.y = 0
          newPosition.y = brickBottom
        }
        // Hit from top (land on brick)
        else if (minOverlap === overlapTop && newVelocity.y > 0) {
          newVelocity.y = 0
          newPosition.y = brickTop - this.gameConstants.PLAYER_HEIGHT
          newIsJumping = false
        }
        // Hit from left
        else if (minOverlap === overlapLeft) {
          newVelocity.x = 0
          newPosition.x = brickLeft - this.gameConstants.PLAYER_WIDTH
        }
        // Hit from right
        else if (minOverlap === overlapRight) {
          newVelocity.x = 0
          newPosition.x = brickRight
        }
      }
    })

    // Update player state
    this.player = {
      position: newPosition,
      velocity: newVelocity,
      isJumping: newIsJumping,
      isSquatting: newIsSquatting,
      isUnderground: newIsUnderground,
      direction: newDirection,
      pipeAnimation: pipeAnimation
    }

    // Notify React to update
    this.callbacks.onPlayerUpdate(this.player)
  }
}

