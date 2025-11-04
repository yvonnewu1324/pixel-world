import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import './App.css'
import GameCanvas from './components/GameCanvas'
import InfoModal from './components/InfoModal'
import MobileMessage from './components/MobileMessage'
import VirtualControls from './components/VirtualControls'
import { Brick, Player } from './types'
import { useMobilePortrait } from './hooks/useMobilePortrait'

// Desktop game canvas dimensions (fixed internal coordinates)
const DESKTOP_GAME_WIDTH = 1400
const DESKTOP_GAME_HEIGHT = 600

// Mobile portrait game canvas dimensions (vertical ratio ~1:2)
const MOBILE_GAME_WIDTH = 450
const MOBILE_GAME_HEIGHT = 900
const BRICK_SIZE = 80
const PLAYER_WIDTH = 125  // 416px * 0.3 scale
const PLAYER_HEIGHT = 187  // 624px * 0.3 scale

// Game keys array - defined outside component to prevent recreation
const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'A', 'd', 'D', 'w', 'W', 's', 'S', ' ']

// Pipe constants (same for both desktop and mobile)
const PIPE_WIDTH = 86
const PIPE_HEIGHT = 86
const PIPE_COLLISION_INSET_LEFT = 26
const PIPE_COLLISION_INSET_RIGHT = 14
const PIPE_COLLISION_INSET = 14
const PIPE_SQUAT_DURATION = 220
const PIPE_ENTER_DURATION = 1000
const PIPE_EXIT_DURATION = 1000
const PIPE_TRANSITION_BUFFER = 160

// Helper function to calculate game constants based on dimensions
function calculateGameConstants(gameWidth: number, gameHeight: number, isMobilePortrait: boolean = false) {
  // Layout proportions:
  // Green grass: 0.1 (10%)
  // Red sand: 0.2 (20%)
  // Blue sky: 0.7 (70%)
  const GREEN_HEIGHT = gameHeight * 0.1
  const GROUND_Y = gameHeight - GREEN_HEIGHT
  const BLACK_EDGE_BOTTOM_Y = GROUND_Y + 4
  const PLAYER_GROUND_Y = BLACK_EDGE_BOTTOM_Y - PLAYER_HEIGHT
  
  // Calculate brick positions
  const NUM_BRICKS = 5
  const LEFT_MARGIN = gameWidth < 500 ? 30 : 100
  const RIGHT_MARGIN = gameWidth < 500 ? 40 : 250
  const AVAILABLE_WIDTH = gameWidth - LEFT_MARGIN - RIGHT_MARGIN

  let calculateBrickX: (index: number) => number
  let BRICK_Y: number
  let BRICK_Y_UPPER: number | undefined // For mobile two-row layout

  // Player ground position - adjust for mobile
  let PLAYER_GROUND_Y_MOBILE = PLAYER_GROUND_Y
  
  if (isMobilePortrait) {
    // Mobile portrait: platform layout
    // Left side (lower): 2 bricks (indices 0, 1) - Education, Experience (keep same position)
    // Left side (upper): 3 bricks (indices 2, 3, 4) - Projects, Skills, Contact (moved from right)
    const LEFT_LOWER_COUNT = 2
    
    // Player stands on green grass area (same as desktop)
    PLAYER_GROUND_Y_MOBILE = BLACK_EDGE_BOTTOM_Y - PLAYER_HEIGHT
    
    // Calculate positions for left side bricks
    const LEFT_GAP = 15 // Gap between bricks
    
    // Y positions for two rows - lower bricks closer to ground, larger height gap for jumping
    // Lower bricks: closer to ground for easier access
    const BRICK_Y_LOWER = GROUND_Y - (PLAYER_HEIGHT * 1.2) - BRICK_SIZE
    BRICK_Y = BRICK_Y_LOWER
    // Upper bricks: more height difference to allow jumping through
    BRICK_Y_UPPER = BRICK_Y_LOWER - (PLAYER_HEIGHT * 1.5) // Increased height difference for jumping
    
    calculateBrickX = (index: number) => {
      if (index < LEFT_LOWER_COUNT) {
        // Left side lower: 0, 1 (Education, Experience) - keep same position
        return LEFT_MARGIN + (index * (BRICK_SIZE + LEFT_GAP))
      } else {
        // Left side upper: 2, 3, 4 (Projects, Skills, Contact) - moved from right
        const upperIndex = index - LEFT_LOWER_COUNT
        return LEFT_MARGIN + (upperIndex * (BRICK_SIZE + LEFT_GAP))
      }
    }
  } else {
    // Desktop: single row layout - keep original settings
    const TOTAL_BRICK_WIDTH = NUM_BRICKS * BRICK_SIZE
    const TOTAL_GAP_WIDTH = AVAILABLE_WIDTH - TOTAL_BRICK_WIDTH
    const GAP_BETWEEN_BRICKS = TOTAL_GAP_WIDTH / (NUM_BRICKS - 1)
    
    // Desktop: original height (keep unchanged)
    BRICK_Y = GROUND_Y - (PLAYER_HEIGHT * 1.2) - BRICK_SIZE
    
    calculateBrickX = (index: number) => {
      return LEFT_MARGIN + (index * (BRICK_SIZE + GAP_BETWEEN_BRICKS))
    }
  }

  // Pipe position - adjust based on device type
  const PIPE_X = gameWidth - PIPE_WIDTH - (gameWidth < 500 ? 20 : 50)
  
  // For mobile: pipe bottom aligns with GROUND_Y
  // For desktop: original height
  let PIPE_Y: number
  let PIPE_BOX: {
    left: number
    right: number
    top: number
    bottom: number
  }
  
  if (isMobilePortrait) {
    // Mobile: pipe stands on green grass (same logic as desktop)
    PIPE_Y = GROUND_Y - PIPE_HEIGHT - 12
    PIPE_BOX = {
      left: PIPE_X + PIPE_COLLISION_INSET_LEFT,
      right: PIPE_X + PIPE_WIDTH - PIPE_COLLISION_INSET_RIGHT,
      top: PIPE_Y + PIPE_COLLISION_INSET,
      bottom: PIPE_Y + PIPE_HEIGHT
    }
  } else {
    // Desktop: original height
    PIPE_Y = GROUND_Y - PIPE_HEIGHT - 12
    PIPE_BOX = {
      left: PIPE_X + PIPE_COLLISION_INSET_LEFT,
      right: PIPE_X + PIPE_WIDTH - PIPE_COLLISION_INSET_RIGHT,
      top: PIPE_Y + PIPE_COLLISION_INSET,
      bottom: PIPE_Y + PIPE_HEIGHT
    }
  }

  const getPipeCenterX = (direction: 'left' | 'right') => {
    const baseCenter = (PIPE_BOX.left + PIPE_BOX.right) / 2 - (PLAYER_WIDTH / 2)
    const VISUAL_OFFSET = direction === 'right' ? -10 : 0
    return baseCenter + VISUAL_OFFSET
  }

  const PIPE_TOP_Y = PIPE_BOX.top - PLAYER_HEIGHT

  return {
    gameWidth,
    gameHeight,
    GROUND_Y,
    PLAYER_GROUND_Y: isMobilePortrait ? PLAYER_GROUND_Y_MOBILE : PLAYER_GROUND_Y,
    BRICK_Y,
    BRICK_Y_UPPER,
    calculateBrickX,
    PIPE_X,
    PIPE_Y,
    PIPE_BOX,
    getPipeCenterX,
    PIPE_TOP_Y,
    isMobilePortrait
  }
}

type PipePhase = 'idle' | 'priming' | 'entering' | 'transitioning' | 'exiting'

interface PipeState {
  phase: PipePhase
  targetIsUnderground: boolean | null
}

// Helper function to create bricks based on game constants
function createBricks(constants: ReturnType<typeof calculateGameConstants>): {
  initialBricks: Brick[]
  undergroundBricks: Brick[]
} {
  const { calculateBrickX, BRICK_Y, BRICK_Y_UPPER, isMobilePortrait } = constants
  
  // Helper to get Y position based on brick index for mobile platform layout
  const getBrickY = (index: number) => {
    if (isMobilePortrait && BRICK_Y_UPPER !== undefined) {
      // Left side lower: indices 0, 1 (Education, Experience) - keep same position
      // Left side upper: indices 2, 3, 4 (Projects, Skills, Contact) - moved from right
      if (index < 2) {
        // Left side - lower row
        return BRICK_Y
      } else {
        // Left side - upper row (higher)
        return BRICK_Y_UPPER
      }
    }
    return BRICK_Y
  }

  // Helper to get Y position for underground bricks
  // Desktop: use same BRICK_Y as initial bricks
  // Mobile: left side 2 bricks, right side 1 brick
  const getUndergroundBrickY = (index: number) => {
    if (isMobilePortrait && BRICK_Y_UPPER !== undefined) {
      // Mobile: underground bricks layout
      // Left side lower: indices 0, 1 (keyboard, music)
      // Right side upper: index 2 (cooking)
      if (index < 2) {
        return BRICK_Y  // Left side - lower row
      } else {
        return BRICK_Y_UPPER  // Right side - upper row
      }
    }
    // Desktop: use original BRICK_Y (same as initial bricks)
    return BRICK_Y
  }

  const undergroundBricks: Brick[] = [
    {
      id: 'keyboard',
      position: { 
        x: isMobilePortrait ? calculateBrickX(0) : calculateBrickX(1), 
        y: getUndergroundBrickY(isMobilePortrait ? 0 : 1) 
      },
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
      position: { 
        x: isMobilePortrait ? calculateBrickX(1) : calculateBrickX(2), 
        y: getUndergroundBrickY(isMobilePortrait ? 1 : 2) 
      },
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
      position: { 
        x: isMobilePortrait ? calculateBrickX(2) : calculateBrickX(3), 
        y: getUndergroundBrickY(isMobilePortrait ? 2 : 3) 
      },
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
      position: { x: calculateBrickX(0), y: getBrickY(0) },
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
      position: { x: calculateBrickX(1), y: getBrickY(1) },
      type: 'experience',
      hit: false,
      content: {
        title: 'Experience',
        description: 'My professional journey',
        items: [
          'Research Assistant at University of California, Davis||Apr. 2024 - Dec. 2024\nWorking with Prof. Anshuman Chhabra and Prof. Magdalena Wojcieszak on Generative AI to analyze polarization in political unstructured natural language\nUtilizing Python and OpenAI API to fine-tune GPT-3.5 models',
          'Software Engineering Intern at LINE TAIWAN LIMITED||Sept. 2021 - June 2023\nDesigned and implemented web deployment automation internal CMS using Golang and MySQL; reducing hardcoded processes and shortening deployment time by 70%\nEngineered mobile subscription APIs with Kafka; supporting over 10K users daily\nDeveloped comprehensive Grafana dashboards for real-time monitoring and event logging\nCreated a Golang automation bot with Kubernetes CronJob that retrieved Trello tasks and generated weekly reports for 5 Scrum teams',
          'Backend Intern at Aptan||Mar. 2021 - Aug. 2021\nIntroduced GraphQL APIs to optimize nested data queries and reduce frontend complexity\nImplemented modular Golang APIs with GORM for user data management; cutting backend development time by 28% and simplifying future feature integration',
          'Software Intern at WeGrains||June 2020 - Dec. 2020\nParticipated in an IoT parking system development; project recognized by Taiwan\'s National Development Fund\nDesigned and implemented MySQL schema and RESTful APIs for parking management system with Node.js and Express.js'
        ]
      }
    },
    {
      id: 'projects',
      position: { x: calculateBrickX(2), y: getBrickY(2) },
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
      position: { x: calculateBrickX(3), y: getBrickY(3) },
      type: 'skills',
      hit: false,
      content: {
        title: 'Skills',
        description: 'My technical expertise',
        items: [
          'Languages: Golang, Python, JavaScript, C++, SQL',
          'Frameworks: Gin, Fx, Express.js, PyTorch, TensorFlow',
          'Frontend: Vue.js, React.js, Nuxt.js, Next.js',
          'Databases: MySQL, MongoDB',
          'Tools: Git, Docker, Kubernetes, Grafana, Drone CI',
          'Strong knowledge in ML, Algorithms, Web Dev'
        ]
      }
    },
    {
      id: 'contact',
      position: { x: calculateBrickX(4), y: getBrickY(4) },
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

  return { initialBricks, undergroundBricks }
}

function App() {
  const isMobilePortrait = useMobilePortrait()
  
  // Calculate game constants based on device type
  const gameConstants = useMemo(() => {
    if (isMobilePortrait) {
      return calculateGameConstants(MOBILE_GAME_WIDTH, MOBILE_GAME_HEIGHT, true)
    } else {
      return calculateGameConstants(DESKTOP_GAME_WIDTH, DESKTOP_GAME_HEIGHT, false)
    }
  }, [isMobilePortrait])

  // Create bricks based on current game constants
  const { initialBricks: desktopInitialBricks, undergroundBricks: desktopUndergroundBricks } = useMemo(
    () => createBricks(calculateGameConstants(DESKTOP_GAME_WIDTH, DESKTOP_GAME_HEIGHT, false)),
    []
  )
  const { initialBricks: mobileInitialBricks, undergroundBricks: mobileUndergroundBricks } = useMemo(
    () => createBricks(calculateGameConstants(MOBILE_GAME_WIDTH, MOBILE_GAME_HEIGHT, true)),
    []
  )

  const [bricks, setBricks] = useState<Brick[]>(isMobilePortrait ? mobileInitialBricks : desktopInitialBricks)
  const bricksRef = useRef<Brick[]>(isMobilePortrait ? mobileInitialBricks : desktopInitialBricks)
  
  // Track which bricks have been hit (persists across world switches)
  const hitBricksRef = useRef<Set<string>>(new Set())
  const [player, setPlayer] = useState<Player>({
    position: { x: 50, y: gameConstants.PLAYER_GROUND_Y },  // Start at ground level
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
  
  // Helper function to apply hit state to bricks
  const applyHitState = useCallback((brickArray: Brick[]): Brick[] => {
    return brickArray.map(brick => ({
      ...brick,
      hit: hitBricksRef.current.has(brick.id)
    }))
  }, [])
  
  // Update bricks and player position when device orientation changes
  useEffect(() => {
    const newBricks = isMobilePortrait ? mobileInitialBricks : desktopInitialBricks
    const bricksWithHitState = applyHitState(newBricks)
    setBricks(bricksWithHitState)
    bricksRef.current = bricksWithHitState
    
    // Update player position to match new ground level
    setPlayer(prev => ({
      ...prev,
      position: { 
        x: Math.min(prev.position.x, gameConstants.gameWidth - PLAYER_WIDTH),
        y: gameConstants.PLAYER_GROUND_Y 
      }
    }))
  }, [isMobilePortrait, desktopInitialBricks, mobileInitialBricks, applyHitState, gameConstants])

  // Keep bricksRef in sync with bricks state
  useEffect(() => {
    bricksRef.current = bricks
  }, [bricks])

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
          position: { x: gameConstants.getPipeCenterX(prev.direction), y: gameConstants.PIPE_TOP_Y },
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
          position: { x: gameConstants.getPipeCenterX(prev.direction), y: gameConstants.PIPE_TOP_Y },
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
        // Switch bricks but preserve hit state
        const newBricks = pipeState.targetIsUnderground 
          ? (isMobilePortrait ? mobileUndergroundBricks : desktopUndergroundBricks)
          : (isMobilePortrait ? mobileInitialBricks : desktopInitialBricks)
        const bricksWithHitState = applyHitState(newBricks)
        setBricks(bricksWithHitState)
        setPlayer(prev => ({
          ...prev,
          position: { x: gameConstants.getPipeCenterX(prev.direction), y: gameConstants.PIPE_TOP_Y },
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
          position: { x: gameConstants.getPipeCenterX(prev.direction), y: gameConstants.PIPE_TOP_Y },
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
  }, [pipeState, setBricks, setPlayer, updatePipeState, gameConstants, isMobilePortrait, mobileUndergroundBricks, desktopUndergroundBricks, mobileInitialBricks, desktopInitialBricks, applyHitState])

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
      if (GAME_KEYS.includes(e.key) && gameStarted) {
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
      if (GAME_KEYS.includes(e.key) && gameStarted) {
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

  // Game loop - use requestAnimationFrame for better performance
  useEffect(() => {
    if (!gameStarted) return // Don't run game loop until game starts

    let animationFrameId: number
    let lastTime = performance.now()
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      
      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval)
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
          // Lower jump height for better control
          const jumpVelocity = isMobilePortrait ? -20 : -18
          if ((currentKeys.has('ArrowUp') || currentKeys.has('w') || currentKeys.has('W') || currentKeys.has(' ')) && !prevPlayer.isJumping) {
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
        const playerRight = newPosition.x + PLAYER_WIDTH
        const playerLeft = newPosition.x
        const playerTop = newPosition.y
        const playerBottom = newPosition.y + PLAYER_HEIGHT

        // Check if player is over the pipe horizontally
        const isOverPipeX = playerRight > gameConstants.PIPE_BOX.left && playerLeft < gameConstants.PIPE_BOX.right

        // Ground collision (stand at GROUND_Y)
        // Only apply ground collision if player is not on top of the pipe
        const isStandingOnPipe = isOverPipeX && Math.abs(newPosition.y - gameConstants.PIPE_TOP_Y) < 10 && prevPlayer.pipeAnimation === 'none'
        
        if (newPosition.y >= gameConstants.PLAYER_GROUND_Y && !isStandingOnPipe && prevPlayer.pipeAnimation === 'none') {
          newPosition.y = gameConstants.PLAYER_GROUND_Y
          newVelocity.y = 0
          newIsJumping = false
        }

        // Screen boundaries (fixed canvas coordinates)
        if (newPosition.x < 0) newPosition.x = 0
        if (newPosition.x > gameConstants.gameWidth - PLAYER_WIDTH) {
          newPosition.x = gameConstants.gameWidth - PLAYER_WIDTH
        }

        // Check if player is standing on top of the pipe
        const isOnPipeTop = Math.abs(newPosition.y - gameConstants.PIPE_TOP_Y) < 10 && isOverPipeX

        // Pipe entry logic - squat on pipe to enter
        if (newIsSquatting && isOnPipeTop && prevPlayer.pipeAnimation === 'none') {
          const transitionStarted = triggerPipeTravel(prevPlayer.isUnderground)

          if (transitionStarted) {
            return {
              ...prevPlayer,
              position: { x: gameConstants.getPipeCenterX(prevPlayer.direction), y: gameConstants.PIPE_TOP_Y },
              velocity: { x: 0, y: 0 },
              isSquatting: true,
              isJumping: false,
              pipeAnimation: 'priming'
            }
          }
        }

        // Pipe collision - treat as solid platform
        if (prevPlayer.pipeAnimation === 'none') {
          // Check if player is horizontally overlapping with pipe
          const isOverPipeXRange = playerRight > gameConstants.PIPE_BOX.left && playerLeft < gameConstants.PIPE_BOX.right
          
          // Check if player is close to pipe top position
          const distanceToPipeTop = Math.abs(newPosition.y - gameConstants.PIPE_TOP_Y)
          
          // If player is very close to pipe top and over the pipe, lock them there
          if (isOverPipeXRange && distanceToPipeTop < 8) {
            // Firmly lock position to prevent any jitter
            newPosition.y = gameConstants.PIPE_TOP_Y
            newVelocity.y = 0
            newIsJumping = false
          }
          // If player is falling down and approaching pipe top
          else if (isOverPipeXRange && newVelocity.y > 0 && distanceToPipeTop < 20) {
            // Check if player's bottom is near or past the pipe top
            if (playerBottom >= gameConstants.PIPE_BOX.top - 5 && playerBottom <= gameConstants.PIPE_BOX.top + 20) {
              newVelocity.y = 0
              newPosition.y = gameConstants.PIPE_TOP_Y
              newIsJumping = false
            }
          }
          
          // Handle side collisions only when player is NOT on top of pipe
          const isOnPipeTopNow = isOverPipeXRange && distanceToPipeTop < 8
          if (!isOnPipeTopNow && playerBottom > gameConstants.PIPE_BOX.top + 15) {
            const isPipeOverlapping =
              playerRight > gameConstants.PIPE_BOX.left &&
              playerLeft < gameConstants.PIPE_BOX.right &&
              playerBottom > gameConstants.PIPE_BOX.top &&
              playerTop < gameConstants.PIPE_BOX.bottom

            if (isPipeOverlapping) {
              const overlapLeft = playerRight - gameConstants.PIPE_BOX.left
              const overlapRight = gameConstants.PIPE_BOX.right - playerLeft
              
              // Push player away from pipe sides
              if (overlapLeft < overlapRight && overlapLeft < 15) {
                newVelocity.x = 0
                newPosition.x = gameConstants.PIPE_BOX.left - PLAYER_WIDTH
              } else if (overlapRight < overlapLeft && overlapRight < 15) {
                newVelocity.x = 0
                newPosition.x = gameConstants.PIPE_BOX.right
              }
            }
          }
        }

        // Brick collision detection - use ref to avoid dependency
        bricksRef.current.forEach(brick => {
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
              // Mark brick as hit in the persistent set
              hitBricksRef.current.add(brick.id)
              // Update state outside of setPlayer callback for better performance
              setBricks(prevBricks => {
                const updated = prevBricks.map(b =>
                  b.id === brick.id ? { ...b, hit: true } : b
                )
                bricksRef.current = updated
                return updated
              })
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
      }
      
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [selectedBrick, gameStarted, triggerPipeTravel, gameConstants]) // Removed bricks from deps - using ref instead

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

  // Handle virtual control touch events
  const handleVirtualKeyDown = useCallback((key: string) => {
    setKeys(prev => {
      const newKeys = new Set(prev).add(key)
      keysRef.current = newKeys
      return newKeys
    })
  }, [])

  const handleVirtualKeyUp = useCallback((key: string) => {
    setKeys(prev => {
      const newKeys = new Set(prev)
      newKeys.delete(key)
      keysRef.current = newKeys
      return newKeys
    })
  }, [])

  // Memoize pipe position to prevent recreation on every render
  const pipePosition = useMemo(() => ({ x: gameConstants.PIPE_X, y: gameConstants.PIPE_Y }), [gameConstants])

  return (
    <>
      <MobileMessage />
      {gameStarted && (
        <GameCanvas 
          player={player} 
          bricks={bricks} 
          pipePosition={pipePosition}
          gameWidth={gameConstants.gameWidth}
          gameHeight={gameConstants.gameHeight}
          isMobilePortrait={isMobilePortrait}
        />
      )}
      {gameStarted && (
        <VirtualControls 
          onKeyDown={handleVirtualKeyDown}
          onKeyUp={handleVirtualKeyUp}
        />
      )}
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
