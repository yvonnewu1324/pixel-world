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
│   │   ├── InfoModal.css
│   │   ├── CookingIcon.tsx    # Custom icon components
│   │   └── KeyboardIcon.tsx
│   ├── types.ts               # TypeScript interfaces
│   ├── App.tsx                # Main app with game logic
│   ├── App.css
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── public/                    # Static assets (images, icons)
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .gitignore                 # Git ignore rules
└── README.md
```

**Note:** The `dist/` directory (build output) and `node_modules/` are ignored by Git as specified in `.gitignore`.

## Tips

- The character has realistic jump physics with gravity
- You need to hit bricks from directly below to activate them
- Each brick can only be hit once (it changes color after being hit)
- The ground is at the bottom of the screen - you can't fall off!

## License

MIT License

Copyright (c) 2025 Yu-Jie Wu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
---

Have fun jumping around your portfolio!
