import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import GameCanvas from './components/GameCanvas'
import InfoModal from './components/InfoModal'
import { Brick, Player } from './types'

// Game canvas dimensions (fixed internal coordinates)
const GAME_WIDTH = 1400
const GAME_HEIGHT = 600
const BRICK_SIZE = 80
const PLAYER_WIDTH = 125  // 416px * 0.3 scale
const PLAYER_HEIGHT = 187  // 624px * 0.3 scale

// Layout proportions:
// Green grass: 0.1 (10%) = 60px at bottom (540px to 600px)
// Red sand: 0.2 (20%) = 120px above green (420px to 540px)  
// Blue sky: 0.7 (70%) = 420px at top (0px to 420px)
const GREEN_HEIGHT = GAME_HEIGHT * 0.1  // 60px
const GROUND_Y = GAME_HEIGHT - GREEN_HEIGHT  // 540px (top of green grass element)
// The ground element has a black box-shadow (4px) at its top edge
// The black edge extends 4px upward from GROUND_Y, so the bottom of the black edge is at GROUND_Y + 4px
const BLACK_EDGE_BOTTOM_Y = GROUND_Y + 4  // 540 + 4 = 544px (bottom of the 4px black edge)

// Calculate positions based on fixed canvas coordinates
// Character's feet (bottom of sprite) should align with the bottom of the black edge
// Player position.y is top of sprite, so position the top at BLACK_EDGE_BOTTOM_Y - PLAYER_HEIGHT
const PLAYER_GROUND_Y = BLACK_EDGE_BOTTOM_Y - PLAYER_HEIGHT  // 544 - 187 = 357px (character's bottom will be at 544px, aligned with bottom of black edge)

// Place bricks 1.2 character heights above the character's toe (ground level)
const BRICK_Y = GROUND_Y - (PLAYER_HEIGHT * 1.2) - BRICK_SIZE

// Calculate brick positions evenly distributed across the game width
const NUM_BRICKS = 5
const LEFT_MARGIN = 100  //  left margin
const RIGHT_MARGIN = 200  // Margin on right side
const AVAILABLE_WIDTH = GAME_WIDTH - LEFT_MARGIN - RIGHT_MARGIN  // 1400 - 0 - 200 = 1200px
const TOTAL_BRICK_WIDTH = NUM_BRICKS * BRICK_SIZE  // 5 * 80 = 400px
const TOTAL_GAP_WIDTH = AVAILABLE_WIDTH - TOTAL_BRICK_WIDTH  // 1200 - 400 = 800px
const GAP_BETWEEN_BRICKS = TOTAL_GAP_WIDTH / (NUM_BRICKS - 1)  // 800 / 4 = 200px

// Calculate x positions for each brick (positioned by their left edge)
const calculateBrickX = (index: number) => {
  return LEFT_MARGIN + (index * (BRICK_SIZE + GAP_BETWEEN_BRICKS))
}

// Pipe constants
const PIPE_WIDTH = 86
const PIPE_HEIGHT = 86
const PIPE_X = GAME_WIDTH - PIPE_WIDTH - 50
const PIPE_Y = GROUND_Y - PIPE_HEIGHT - 12
const PIPE_COLLISION_INSET_LEFT = 26
const PIPE_COLLISION_INSET_RIGHT = 14
const PIPE_COLLISION_INSET = 14
const PIPE_SQUAT_DURATION = 220
const PIPE_ENTER_DURATION = 1000
const PIPE_EXIT_DURATION = 1000
const PIPE_TRANSITION_BUFFER = 160

// Pipe helpers
const PIPE_BOX = {
  left: PIPE_X + PIPE_COLLISION_INSET_LEFT,
  right: PIPE_X + PIPE_WIDTH - PIPE_COLLISION_INSET_RIGHT,
  top: PIPE_Y + PIPE_COLLISION_INSET,
  bottom: PIPE_Y + PIPE_HEIGHT
}
// Calculate pipe center X accounting for sprite visual offset
// The sprite's visual content is not centered in the bounding box - it's offset left
// When facing left (flipped), the flip around left edge centers it better
// When facing right, we need to shift left to compensate for the visual offset
const getPipeCenterX = (direction: 'left' | 'right') => {
  const baseCenter = (PIPE_BOX.left + PIPE_BOX.right) / 2 - (PLAYER_WIDTH / 2)
  // Sprite visual offset - adjust this value if needed (negative = shift left, positive = shift right)
  const VISUAL_OFFSET = direction === 'right' ? -10 : 0
  return baseCenter + VISUAL_OFFSET
}
const PIPE_TOP_Y = PIPE_BOX.top - PLAYER_HEIGHT

type PipePhase = 'idle' | 'priming' | 'entering' | 'transitioning' | 'exiting'

interface PipeState {
  phase: PipePhase
  targetIsUnderground: boolean | null
}

// Underground bricks for hobbies
const undergroundBricks: Brick[] = [
  {
    id: 'keyboard',
    position: { x: calculateBrickX(1), y: BRICK_Y },
    type: 'keyboard',
    hit: false,
    content: {
      title: 'Keyboards',
      description: 'My mechanical keyboard passion',
      items: [
        'Love experimenting with different switches and keycaps',
        '75% keyboard is my favorite, but alice layout is also niceeeee!',
        'Thocky and creamy sounds is the best!'
      ]
    }
  },
  {
    id: 'music',
    position: { x: calculateBrickX(2), y: BRICK_Y },
    type: 'music',
    hit: false,
    content: {
      title: 'Music',
      description: 'While I\'m not coding, I\'m usually listening to music',
      items: [
        'Big KPOP Fan, my favorite artist is KAI from EXO',
        'love listening to indie music',
      ]
    }
  },
  {
    id: 'cooking',
    position: { x: calculateBrickX(3), y: BRICK_Y },
    type: 'cooking',
    hit: false,
    content: {
      title: 'Cooking',
      description: 'My favorite hobby',
      items: [
        'Love experimenting with new recipes',
        'Always exploring different cuisines',
        'Enjoy trying different flavors and techniques'
      ]
    }
  }
]

const initialBricks: Brick[] = [
  {
    id: 'education',
    position: { x: calculateBrickX(0), y: BRICK_Y },
    type: 'education',
    hit: false,
    content: {
      title: 'Education',
      description: 'My academic background',
      items: [
        'University of California, Davis GPA: 3.93/4.0||Davis, CA\nM.S. in Computer Science||Expected Dec. 2025',
        'National Chengchi University GPA: 3.98/4.3||Taipei, Taiwan\nB.S. in Management Information Systems||June 2023'
      ]
    }
  },
  {
    id: 'experience',
    position: { x: calculateBrickX(1), y: BRICK_Y },
    type: 'experience',
    hit: false,
    content: {
      title: 'Experience',
      description: 'My professional journey',
      items: [
        'Software Engineering Intern at LINE TAIWAN LIMITED||Sept. 2021 - June 2023\nDesigned and implemented web deployment automation internal CMS using Golang and MySQL; reducing hardcoded processes and shortening deployment time by 70%\nEngineered mobile subscription APIs with Kafka; supporting over 10K users daily\nDeveloped comprehensive Grafana dashboards for real-time monitoring and event logging\nCreated a Golang automation bot with Kubernetes CronJob that retrieved Trello tasks and generated weekly reports for 5 Scrum teams',
        'Backend Intern at Aptan||Mar. 2021 - Aug. 2021\nIntroduced GraphQL APIs to optimize nested data queries and reduce frontend complexity\nImplemented modular Golang APIs with GORM for user data management; cutting backend development time by 28% and simplifying future feature integration',
        'Software Intern at WeGrains||June 2020 - Dec. 2020\nParticipated in an IoT parking system development; project recognized by Taiwan\'s National Development Fund\nDesigned and implemented MySQL schema and RESTful APIs for parking management system with Node.js and Express.js'
      ]
    }
  },
  {
    id: 'projects',
    position: { x: calculateBrickX(2), y: BRICK_Y },
    type: 'projects',
    hit: false,
    content: {
      title: 'Projects',
      description: 'Things I\'ve built',
      items: [
        'SmartStudy: RAG-Powered Learning Assistant\nBuilt with LangChain + LLAMA-3 8B and FAISS for intelligent document retrieval and question answering\nGitHub: https://github.com/SaishaShetty/SmartStudy',
        'Ciphertext Classifiers with DistilBERT\nDeveloped ML model using Word2Vec + BiLSTM + CNN achieving 88% accuracy in ciphertext classification\nGitHub: https://github.com/yvonnewu1324/ciphertext-classifier',
        'House Rent Info Bot - Distributed System\nDistributed messaging system using Zookeeper, Kafka, KSQL with Node.js backend\nGitHub: https://github.com/a25906976/kafka_RentBot'
      ]
    }
  },
  {
    id: 'skills',
    position: { x: calculateBrickX(3), y: BRICK_Y },
    type: 'skills',
    hit: false,
    content: {
      title: 'Skills',
      description: 'My technical expertise',
      items: [
        'Languages: Golang, Python, JavaScript, C++, SQL',
        'Frameworks: Gin, Fx, Express, PyTorch, TensorFlow',
        'Frontend: Nuxt.js, Next.js',
        'Databases: MySQL, MongoDB',
        'Tools: Git, Docker, Kubernetes, Grafana, Drone CI',
        'Strong knowledge in ML, Algorithms, Web Dev'
      ]
    }
  },
  {
    id: 'contact',
    position: { x: calculateBrickX(4), y: BRICK_Y },
    type: 'contact',
    hit: false,
    content: {
      title: 'Contact',
      description: 'Get in touch!',
      items: [
        'Email: imyujiewu@gmail.com',
        'GitHub: https://github.com/yvonnewu1324',
        'LinkedIn: https://www.linkedin.com/in/yu-jie-wu-a07823172',
        'Discord:  https://discord.com/users/830374912279576617'
      ]
    }
  },
]

function App() {
  const [bricks, setBricks] = useState<Brick[]>(initialBricks)
  const [player, setPlayer] = useState<Player>({
    position: { x: 50, y: PLAYER_GROUND_Y },  // Start at ground level
    velocity: { x: 0, y: 0 },
    isJumping: false,
    isSquatting: false,
    direction: 'right',
    isUnderground: false,
    pipeAnimation: 'none'
  })
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const keysRef = useRef<Set<string>>(new Set())
  const [selectedBrick, setSelectedBrick] = useState<Brick | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [pipeState, setPipeState] = useState<PipeState>({ phase: 'idle', targetIsUnderground: null })
  const pipeStateRef = useRef(pipeState)
  const stageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handledPhaseRef = useRef<PipePhase>('idle')

  const updatePipeState = useCallback((next: PipeState | ((prev: PipeState) => PipeState)) => {
    setPipeState(prev => {
      const nextState = typeof next === 'function'
        ? (next as (prevState: PipeState) => PipeState)(prev)
        : next
      pipeStateRef.current = nextState
      return nextState
    })
  }, [])

  const triggerPipeTravel = useCallback((currentIsUnderground: boolean) => {
    if (pipeStateRef.current.phase !== 'idle') {
      return false
    }
    const targetIsUnderground = !currentIsUnderground
    updatePipeState({ phase: 'priming', targetIsUnderground })
    return true
  }, [updatePipeState])

  useEffect(() => {
    pipeStateRef.current = pipeState
  }, [pipeState])

  useEffect(() => {
    return () => {
      if (stageTimeoutRef.current) {
        clearTimeout(stageTimeoutRef.current)
      }
    }
  }, [])

  // Update ref whenever keys state changes
  useEffect(() => {
    keysRef.current = keys
  }, [keys])

  useEffect(() => {
    if (handledPhaseRef.current === pipeState.phase) {
      return
    }

    handledPhaseRef.current = pipeState.phase

    if (stageTimeoutRef.current) {
      clearTimeout(stageTimeoutRef.current)
      stageTimeoutRef.current = null
    }

    switch (pipeState.phase) {
      case 'idle':
        setPlayer(prev => ({
          ...prev,
          velocity: { x: 0, y: 0 },
          isJumping: false,
          isSquatting: false,
          pipeAnimation: 'none'
        }))
        break
      case 'priming':
        setPlayer(prev => ({
          ...prev,
          position: { x: getPipeCenterX(prev.direction), y: PIPE_TOP_Y },
          velocity: { x: 0, y: 0 },
          isJumping: false,
          isSquatting: true,
          pipeAnimation: 'priming'
        }))
        stageTimeoutRef.current = setTimeout(() => {
          updatePipeState(prev => ({
            ...prev,
            phase: 'entering'
          }))
        }, PIPE_SQUAT_DURATION)
        break
      case 'entering':
        setPlayer(prev => ({
          ...prev,
          position: { x: getPipeCenterX(prev.direction), y: PIPE_TOP_Y },
          velocity: { x: 0, y: 0 },
          isJumping: false,
          isSquatting: false,
          pipeAnimation: 'entering'
        }))
        stageTimeoutRef.current = setTimeout(() => {
          updatePipeState(prev => ({
            ...prev,
            phase: 'transitioning'
          }))
        }, PIPE_ENTER_DURATION)
        break
      case 'transitioning':
        if (pipeState.targetIsUnderground === null) {
          updatePipeState({ phase: 'idle', targetIsUnderground: null })
          return
        }
        setBricks(pipeState.targetIsUnderground ? undergroundBricks : initialBricks)
        setPlayer(prev => ({
          ...prev,
          position: { x: getPipeCenterX(prev.direction), y: PIPE_TOP_Y },
          velocity: { x: 0, y: 0 },
          isJumping: false,
          isSquatting: false,
          isUnderground: pipeState.targetIsUnderground!,
          pipeAnimation: 'transitioning'
        }))
        stageTimeoutRef.current = setTimeout(() => {
          updatePipeState(prev => ({
            ...prev,
            phase: 'exiting'
          }))
        }, PIPE_TRANSITION_BUFFER)
        break
      case 'exiting':
        setPlayer(prev => ({
          ...prev,
          position: { x: getPipeCenterX(prev.direction), y: PIPE_TOP_Y },
          velocity: { x: 0, y: 0 },
          isJumping: false,
          isSquatting: false,
          pipeAnimation: 'exiting'
        }))
        stageTimeoutRef.current = setTimeout(() => {
          updatePipeState({ phase: 'idle', targetIsUnderground: null })
        }, PIPE_EXIT_DURATION)
        break
    }
  }, [pipeState, setBricks, setPlayer, updatePipeState])

  // Preload images to prevent blinking on first use
  useEffect(() => {
    const imagesToPreload = [
      '/squat.png',
      '/idle2.png',
      '/walk4.png',
      '/jump.png',
      '/pipe.png'
    ]
    
    imagesToPreload.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser behavior for game keys (only when game started)
      const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'A', 'd', 'D', 'w', 'W', 's', 'S', ' ']
      if (gameKeys.includes(e.key) && gameStarted) {
        e.preventDefault()
      }
      
      // Always track keys
      setKeys(prev => {
        const newKeys = new Set(prev).add(e.key)
        keysRef.current = newKeys
        return newKeys
      })
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Prevent default browser behavior for game keys (only when game started)
      const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'A', 'd', 'D', 'w', 'W', 's', 'S', ' ']
      if (gameKeys.includes(e.key) && gameStarted) {
        e.preventDefault()
      }
      
      // Always track keys
      setKeys(prev => {
        const newKeys = new Set(prev)
        newKeys.delete(e.key)
        keysRef.current = newKeys
        return newKeys
      })
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [gameStarted])

  // Game loop
  useEffect(() => {
    if (!gameStarted) return // Don't run game loop until game starts

    const gameLoop = setInterval(() => {
      setPlayer(prevPlayer => {
        let newVelocity = { ...prevPlayer.velocity }
        let newPosition = { ...prevPlayer.position }
        let newDirection = prevPlayer.direction
        let newIsJumping = prevPlayer.isJumping
        let newIsSquatting = false
        let newIsUnderground = prevPlayer.isUnderground

        // Disable all physics and movement during pipe animations
        if (prevPlayer.pipeAnimation !== 'none') {
          // Keep squatting during priming phase for squat sprite
          const animationSquatting = prevPlayer.pipeAnimation === 'priming'

          return {
            ...prevPlayer,
            velocity: { x: 0, y: 0 },
            position: { ...prevPlayer.position },
            isSquatting: animationSquatting,
            isJumping: false
          }
        }

        // Disable movement when modal is open
        if (selectedBrick) {
          newVelocity.x = 0
          newVelocity.y += 0.8 // Still apply gravity
        } else {
          // Horizontal movement - use ref to get latest key state
          const currentKeys = keysRef.current
          
          // Check for squat first (takes priority over horizontal movement when on ground)
          if ((currentKeys.has('ArrowDown') || currentKeys.has('s') || currentKeys.has('S')) && !prevPlayer.isJumping) {
            newIsSquatting = true
            newVelocity.x = 0 // Can't move while squatting
          } else {
            if (currentKeys.has('ArrowLeft') || currentKeys.has('a') || currentKeys.has('A')) {
              newVelocity.x = -5
              newDirection = 'left'
            } else if (currentKeys.has('ArrowRight') || currentKeys.has('d') || currentKeys.has('D')) {
              newVelocity.x = 5
              newDirection = 'right'
            } else {
              newVelocity.x = 0
            }
          }

          // Jump - use ref to get latest key state
          if ((currentKeys.has('ArrowUp') || currentKeys.has('w') || currentKeys.has('W') || currentKeys.has(' ')) && !prevPlayer.isJumping) {
            newVelocity.y = -18
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
        const playerRight = newPosition.x + PLAYER_WIDTH
        const playerLeft = newPosition.x
        const playerTop = newPosition.y
        const playerBottom = newPosition.y + PLAYER_HEIGHT

        // Check if player is over the pipe horizontally
        const isOverPipeX = playerRight > PIPE_BOX.left && playerLeft < PIPE_BOX.right

        // Ground collision (stand at GROUND_Y)
        // Only apply ground collision if player is not on top of the pipe
        const isStandingOnPipe = isOverPipeX && Math.abs(newPosition.y - PIPE_TOP_Y) < 15 && prevPlayer.pipeAnimation === 'none'
        
        if (newPosition.y >= PLAYER_GROUND_Y && !isStandingOnPipe && prevPlayer.pipeAnimation === 'none') {
          newPosition.y = PLAYER_GROUND_Y
          newVelocity.y = 0
          newIsJumping = false
        }

        // Screen boundaries (fixed canvas coordinates)
        if (newPosition.x < 0) newPosition.x = 0
        if (newPosition.x > GAME_WIDTH - PLAYER_WIDTH) {
          newPosition.x = GAME_WIDTH - PLAYER_WIDTH
        }

        // Check if player is standing on top of the pipe
        const isOnPipeTop = Math.abs(newPosition.y - PIPE_TOP_Y) < 10 && isOverPipeX

        // Pipe entry logic - squat on pipe to enter
        if (newIsSquatting && isOnPipeTop && prevPlayer.pipeAnimation === 'none') {
          const transitionStarted = triggerPipeTravel(prevPlayer.isUnderground)

          if (transitionStarted) {
            return {
              ...prevPlayer,
              position: { x: getPipeCenterX(prevPlayer.direction), y: PIPE_TOP_Y },
              velocity: { x: 0, y: 0 },
              isSquatting: true,
              isJumping: false,
              pipeAnimation: 'priming'
            }
          }
        }

        // Pipe collision - treat as solid platform
        if (prevPlayer.pipeAnimation === 'none') {
          const isPipeOverlapping =
            playerRight > PIPE_BOX.left &&
            playerLeft < PIPE_BOX.right &&
            playerBottom > PIPE_BOX.top &&
            playerTop < PIPE_BOX.bottom

          if (isPipeOverlapping) {
            const overlapLeft = playerRight - PIPE_BOX.left
            const overlapRight = PIPE_BOX.right - playerLeft
            const overlapTop = playerBottom - PIPE_BOX.top
            const overlapBottom = PIPE_BOX.bottom - playerTop
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

            if (minOverlap === overlapTop && newVelocity.y > 0) {
              newVelocity.y = 0
              newPosition.y = PIPE_TOP_Y
              newIsJumping = false
            } else if (minOverlap === overlapLeft) {
              newVelocity.x = 0
              newPosition.x = PIPE_BOX.left - PLAYER_WIDTH
            } else if (minOverlap === overlapRight) {
              newVelocity.x = 0
              newPosition.x = PIPE_BOX.right
            }
          }

          // Snap player to pipe top if they're close and standing still
          if (isOverPipeX && Math.abs(newPosition.y - PIPE_TOP_Y) < 20 && newVelocity.y === 0 && !newIsJumping) {
            if (newPosition.y < PIPE_TOP_Y - 5) {
              newPosition.y = PIPE_TOP_Y
            }
          }
        }

        // Brick collision detection
        bricks.forEach(brick => {
          const brickTop = brick.position.y
          const brickBottom = brick.position.y + BRICK_SIZE
          const brickLeft = brick.position.x
          const brickRight = brick.position.x + BRICK_SIZE

          const playerTop = newPosition.y
          const playerBottom = newPosition.y + PLAYER_HEIGHT
          const playerLeft = newPosition.x
          const playerRight = newPosition.x + PLAYER_WIDTH
          const playerCenterX = newPosition.x + PLAYER_WIDTH / 2

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
              setBricks(prevBricks =>
                prevBricks.map(b =>
                  b.id === brick.id ? { ...b, hit: true } : b
                )
              )
              setSelectedBrick(brick)
              newVelocity.y = 0
              newPosition.y = brickBottom
            }
            // Hit from top (land on brick)
            else if (minOverlap === overlapTop && newVelocity.y > 0) {
              newVelocity.y = 0
              newPosition.y = brickTop - PLAYER_HEIGHT
              newIsJumping = false
            }
            // Hit from left
            else if (minOverlap === overlapLeft) {
              newVelocity.x = 0
              newPosition.x = brickLeft - PLAYER_WIDTH
            }
            // Hit from right
            else if (minOverlap === overlapRight) {
              newVelocity.x = 0
              newPosition.x = brickRight
            }
          }
        })

        return {
          position: newPosition,
          velocity: newVelocity,
          isJumping: newIsJumping,
          isSquatting: newIsSquatting,
          isUnderground: newIsUnderground,
          direction: newDirection,
          pipeAnimation: prevPlayer.pipeAnimation
        }
      })
    }, 1000 / 60) // 60 FPS

    return () => clearInterval(gameLoop)
  }, [bricks, selectedBrick, gameStarted, triggerPipeTravel])

  const closeModal = useCallback(() => {
    setSelectedBrick(null)
  }, [])

  const handleStartGame = useCallback(() => {
    setShowWelcome(false)
    setGameStarted(true)
    // Clear any keys that might have been pressed before game started
    setKeys(new Set())
    keysRef.current = new Set()
  }, [])

  return (
    <>
      {gameStarted && <GameCanvas player={player} bricks={bricks} pipePosition={{ x: PIPE_X, y: PIPE_Y }} />}
      {selectedBrick && (
        <InfoModal brick={selectedBrick} onClose={closeModal} />
      )}
      {showWelcome && (
        <div className="welcome-dialog">
          <div className="welcome-scene">
            <div className="speech-balloon">
              <h1>Hii, I'm Yu-Jie!</h1>
              <p>Join me on my tech adventure!</p>
              <button className="start-button" onClick={handleStartGame}>
                START
              </button>
            </div>
            <div className="welcome-character">
              <img src="/welcome2.png" alt="Yu-Jie" className="character-sprite" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
