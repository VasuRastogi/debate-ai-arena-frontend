
import { Card } from "@/components/ui/card";
import { DebateState, RoundType } from "@/types/debate";

interface DebateStatusProps {
  debateState: DebateState;
}

export default function DebateStatus({ debateState }: DebateStatusProps) {
  const { 
    topic, 
    team1Position, 
    team2Position, 
    currentRound, 
    scores
  } = debateState;
  
  // Calculate current scores
  const getTeamScores = () => {
    if (scores.length === 0) return { team1: 0, team2: 0 };
    
    let team1Total = 0;
    let team2Total = 0;
    
    scores.forEach(score => {
      team1Total += score.team1Score;
      team2Total += score.team2Score;
    });
    
    return { team1: team1Total, team2: team2Total };
  };
  
  const { team1, team2 } = getTeamScores();
  
  // Get round description
  const getRoundDescription = (round: RoundType) => {
    switch(round) {
      case "Constructive":
        return "Present your main arguments";
      case "Crossfire":
        return "Question each other's arguments";
      case "Rebuttal":
        return "Address opponent's arguments";
      case "Summary":
        return "Summarize main points";
      case "Final Focus":
        return "Final argumentation";
      case "Preparation":
        return "Prepare for next round";
      case "Judging":
        return "Judge evaluating debate";
      case "Results":
        return "Final debate results";
      default:
        return "";
    }
  };

  return (
    <div className="debate-card">
      <h2 className="text-xl font-bold text-center mb-4">Debate Status</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Topic</h3>
          <p className="text-lg font-medium">{topic}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-debate-pro">Team 1 (Pro)</h3>
            <p className="text-lg font-medium">{team1Position}</p>
            <p className="text-lg font-bold mt-1">{team1} pts</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-debate-con">Team 2 (Con)</h3>
            <p className="text-lg font-medium">{team2Position}</p>
            <p className="text-lg font-bold mt-1">{team2} pts</p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Current Round</h3>
          <p className="text-lg font-medium">{currentRound}</p>
          <p className="text-sm text-gray-600">{getRoundDescription(currentRound)}</p>
        </div>
      </div>
    </div>
  );
}
