# Mario-Style Personal Portfolio Website

An interactive personal portfolio website inspired by Super Mario Bros! Jump around and hit bricks to reveal information about education, projects, skills, and contact details.

## Features

- **Interactive Gameplay**: Control a Mario-style character using keyboard controls
- **Custom Pixel Art Icons**: Each brick has a unique pixel-art icon:
  - Book icon for Education
  - Screen/Monitor icon for Projects
  - Tool/Wrench icon for Skills
  - Mail/Envelope icon for Contact
- **Smooth Animations**: Mario-style physics with jumping, gravity, and brick-hitting effects
- **Responsive Modals**: Click bricks from below to reveal detailed information
- **Retro Aesthetic**: Pixel-perfect Mario-themed design with classic colors

## Controls

- **Arrow Keys** or **WASD**: Move left/right
- **Space Bar** or **Up Arrow** or **W**: Jump
- **ESC** or **Click Outside**: Close modal

## How to Play

1. Use the controls to move your character left and right
2. Jump up and hit the bricks from below
3. When you hit a brick, it will reveal information in a popup modal
4. Each brick contains different information about the portfolio owner

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Customization

### Update Your Information

Edit the brick content in [src/App.tsx](src/App.tsx):

```typescript
const initialBricks: Brick[] = [
  {
    id: 'education',
    position: { x: 200, y: 200 },
    type: 'education',
    hit: false,
    content: {
      title: 'Education',
      description: 'My academic journey',
      items: [
        'Your degree here',
        'Your university here',
        // Add more items...
      ]
    }
  },
  // Update other bricks...
]
```

### Adjust Brick Positions

Change the `x` and `y` values in the `position` property to reposition bricks on the screen.

### Modify Colors

Edit the CSS files in [src/components/](src/components/) to customize:
- Brick colors ([Brick.css](src/components/Brick.css))
- Character appearance ([Player.css](src/components/Player.css))
- Background colors ([GameCanvas.css](src/components/GameCanvas.css))
- Modal styling ([InfoModal.css](src/components/InfoModal.css))

### Add More Bricks

1. Add a new brick type to the `Brick` interface in [src/types.ts](src/types.ts)
2. Create a new icon function in [src/components/Brick.tsx](src/components/Brick.tsx)
3. Add the brick to the `initialBricks` array in [src/App.tsx](src/App.tsx)

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **CSS3** - Styling and animations

## Project Structure

```
personal-website/
├── src/
│   ├── components/
│   │   ├── Brick.tsx          # Brick component with pixel art icons
│   │   ├── Brick.css
│   │   ├── GameCanvas.tsx     # Main game container
│   │   ├── GameCanvas.css
│   │   ├── Player.tsx         # Character component
│   │   ├── Player.css
│   │   ├── InfoModal.tsx      # Popup modal for brick info
│   │   └── InfoModal.css
│   ├── types.ts               # TypeScript interfaces
│   ├── App.tsx                # Main app with game logic
│   ├── App.css
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Tips

- The character has realistic jump physics with gravity
- You need to hit bricks from directly below to activate them
- Each brick can only be hit once (it changes color after being hit)
- The ground is at the bottom of the screen - you can't fall off!

## License

Free to use and modify for your personal portfolio!

---

Have fun jumping around your portfolio!
