
// Debate participants
export type PlayerRole = 'A' | 'B' | 'C' | 'D';

// Teams
export type TeamType = 'T1' | 'T2';

// Position in debate
export type DebatePosition = 'Pro' | 'Con';

// Application modes
export type DebateMode = 'single-player' | 'multiplayer';

// Round types
export type RoundType = 
  | 'Constructive' 
  | 'Crossfire' 
  | 'Rebuttal' 
  | 'Summary' 
  | 'Final Focus' 
  | 'Preparation'
  | 'Judging'
  | 'Results';

// Round durations in seconds
export const ROUND_DURATIONS: Record<RoundType, number> = {
  'Constructive': 240, // 4 minutes
  'Crossfire': 180,    // 3 minutes
  'Rebuttal': 180,     // 3 minutes
  'Summary': 120,      // 2 minutes
  'Final Focus': 120,  // 2 minutes
  'Preparation': 120,  // 2 minutes per team
  'Judging': 180,      // 3 minutes for judging
  'Results': 0         // No time limit for results
};

// Round order
export const ROUND_ORDER: RoundType[] = [
  'Constructive',
  'Crossfire',
  'Rebuttal',
  'Summary',
  'Final Focus',
  'Judging',
  'Results'
];

// Round speaking order
export const ROUND_SPEAKERS: Record<RoundType, PlayerRole[]> = {
  'Constructive': ['A', 'C'],
  'Crossfire': ['A', 'C'],
  'Rebuttal': ['B', 'D'],
  'Summary': ['A', 'C'],
  'Final Focus': ['B', 'D'],
  'Preparation': [], // No specific speaker
  'Judging': [],     // Judge speaking
  'Results': []      // No specific speaker
};

// Speaker information
export interface Speaker {
  role: PlayerRole;
  name: string;
  team: TeamType;
  isAI: boolean;
  isActive: boolean;
}

// Transcription message
export interface TranscriptionMessage {
  id: string;
  speaker: PlayerRole | 'moderator' | 'judge';
  text: string;
  timestamp: number;
}

// Debate scores
export interface RoundScore {
  round: RoundType;
  team1Score: number;
  team2Score: number;
  feedback: string;
}

// Complete debate state
export interface DebateState {
  topic: string;
  team1Position: DebatePosition;
  team2Position: DebatePosition;
  currentRound: RoundType;
  currentSpeaker: PlayerRole | 'moderator' | 'judge' | null;
  timeRemaining: number;
  isTimerRunning: boolean;
  prepTimeRemaining: { T1: number, T2: number };
  speakers: Record<PlayerRole, Speaker>;
  transcriptions: TranscriptionMessage[];
  scores: RoundScore[];
  moderatorAnnouncements: string[];
  finalResults: {
    winner: TeamType | 'tie' | null;
    team1TotalScore: number;
    team2TotalScore: number;
    feedback: string;
  } | null;
}
