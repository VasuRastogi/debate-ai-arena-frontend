
import { DebateState, DebatePosition, PlayerRole, RoundType, TeamType, Speaker, TranscriptionMessage, RoundScore } from "../types/debate";

export const generateTestDebate = (
  mode: 'single-player' | 'multiplayer',
  userName: string,
  userTeammate?: string
): DebateState => {
  // Determine who is AI based on mode
  const isPlayerBAI = mode === 'single-player';
  
  const speakers: Record<PlayerRole, Speaker> = {
    'A': {
      role: 'A',
      name: userName,
      team: 'T1',
      isAI: false,
      isActive: true
    },
    'B': {
      role: 'B',
      name: userTeammate || 'AI Assistant B',
      team: 'T1',
      isAI: isPlayerBAI,
      isActive: false
    },
    'C': {
      role: 'C',
      name: 'AI Debater C',
      team: 'T2',
      isAI: true,
      isActive: false
    },
    'D': {
      role: 'D',
      name: 'AI Debater D',
      team: 'T2',
      isAI: true,
      isActive: false
    }
  };

  const debateTopic = "Should artificial intelligence development be more heavily regulated?";
  const team1Position: DebatePosition = "Pro";
  const team2Position: DebatePosition = "Con";

  const transcriptions: TranscriptionMessage[] = [
    {
      id: '1',
      speaker: 'moderator',
      text: `Welcome to today's debate on the topic: "${debateTopic}". Team 1 will argue ${team1Position}, and Team 2 will argue ${team2Position}.`,
      timestamp: Date.now() - 60000
    },
    {
      id: '2',
      speaker: 'moderator',
      text: `We'll begin with Constructive speeches. Player A from Team 1, you have 4 minutes. Please begin.`,
      timestamp: Date.now() - 30000
    }
  ];

  // Example score for development
  const scores: RoundScore[] = [];

  return {
    topic: debateTopic,
    team1Position: team1Position,
    team2Position: team2Position,
    currentRound: 'Constructive',
    currentSpeaker: 'A',
    timeRemaining: 240, // 4 minutes for constructive round
    isTimerRunning: false,
    prepTimeRemaining: { T1: 120, T2: 120 }, // 2 minutes per team
    speakers,
    transcriptions,
    scores,
    moderatorAnnouncements: [],
    finalResults: null
  };
};

export const generateTestResults = (state: DebateState): DebateState => {
  // Create sample final results
  const finalResults = {
    winner: 'T1' as TeamType, 
    team1TotalScore: 85,
    team2TotalScore: 78,
    feedback: `Team 1 presented stronger evidence and more coherent arguments throughout the debate. 
      They excelled in rebutting Team 2's points about regulation stifling innovation. 
      Team 2 made persuasive points about free market solutions but could have provided more concrete examples.`
  };

  // Create sample scores for each round
  const roundScores: RoundScore[] = [
    {
      round: 'Constructive',
      team1Score: 28,
      team2Score: 26,
      feedback: "Team 1 presented clear arguments with strong evidence. Team 2 had good points but lacked specific examples."
    },
    {
      round: 'Crossfire',
      team1Score: 17,
      team2Score: 15,
      feedback: "Team 1 responded effectively to challenges. Team 2 could improve question specificity."
    },
    {
      round: 'Rebuttal',
      team1Score: 16,
      team2Score: 15,
      feedback: "Both teams addressed opposing arguments well. Team 1 slightly more thorough in responses."
    },
    {
      round: 'Summary',
      team1Score: 12,
      team2Score: 11,
      feedback: "Team 1 had a more cohesive summary of key points. Team 2 introduced new arguments too late."
    },
    {
      round: 'Final Focus',
      team1Score: 12,
      team2Score: 11,
      feedback: "Team 1 emphasized strongest points effectively. Team 2's conclusion was compelling but missed addressing key counterarguments."
    }
  ];

  return {
    ...state,
    currentRound: 'Results',
    currentSpeaker: null,
    isTimerRunning: false,
    scores: roundScores,
    finalResults
  };
};

export const generateSampleTranscript = (): TranscriptionMessage[] => {
  return [
    {
      id: '1',
      speaker: 'moderator',
      text: "Welcome to today's debate on AI regulation. Team 1 will argue Pro, and Team 2 will argue Con.",
      timestamp: Date.now() - 600000,
    },
    {
      id: '2',
      speaker: 'A',
      text: "Thank you, Moderator. I'd like to argue that AI regulation is necessary for three key reasons: safety, ethics, and economic stability.",
      timestamp: Date.now() - 550000,
    },
    {
      id: '3',
      speaker: 'A',
      text: "First, regarding safety, unregulated AI development poses significant risks. Without proper oversight, powerful AI systems could be deployed without adequate safety testing or security measures.",
      timestamp: Date.now() - 530000,
    },
    {
      id: '4',
      speaker: 'C',
      text: "While I appreciate my opponent's concerns about safety, I believe that excessive regulation would stifle innovation and slow down important technological advancements.",
      timestamp: Date.now() - 490000,
    },
    {
      id: '5',
      speaker: 'C',
      text: "The free market is already incentivizing companies to develop safe AI through consumer demand and liability concerns. Additional regulation would create bureaucratic hurdles that delay beneficial AI applications.",
      timestamp: Date.now() - 470000,
    },
    {
      id: '6',
      speaker: 'moderator',
      text: "Thank you both for your constructive speeches. We will now move to the Crossfire round where both speakers will engage directly.",
      timestamp: Date.now() - 430000,
    }
  ];
};
