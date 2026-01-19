export type CharacterRole = 'Protagonist' | 'Antagonist' | 'Supporting' | 'Minor' | 'Villain';

export interface CharacterProfile {
  id: string;
  name: string;
  age: number;
  nationality: string;
  skinTone: string;
  role: CharacterRole;
  motivation: string;
  personalityTraits: string[];
  backstory: string;
  consistencyScore: number; // 0-100
}

export interface Message {
  id: string;
  role: 'user' | 'character';
  content: string;
  timestamp: Date;
}