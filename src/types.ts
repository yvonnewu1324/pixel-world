export interface Position {
  x: number;
  y: number;
}

export interface Brick {
  id: string;
  position: Position;
  type: 'education' | 'projects' | 'skills' | 'contact' | 'experience' | 'keyboard' | 'music' | 'cooking';
  hit: boolean;
  content: BrickContent;
}

export interface BrickContent {
  title: string;
  description: string;
  items?: string[];
}

export interface Player {
  position: Position;
  velocity: { x: number; y: number };
  isJumping: boolean;
  isSquatting: boolean;
  direction: 'left' | 'right';
  isUnderground: boolean;
  pipeAnimation: 'none' | 'priming' | 'entering' | 'exiting' | 'transitioning';
}
