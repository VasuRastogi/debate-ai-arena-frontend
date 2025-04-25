
import { useState, useEffect } from "react";
import { Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DebateState, TeamType } from "@/types/debate";
import DebaterAvatar from "./DebaterAvatar";
import TranscriptionPanel from "./TranscriptionPanel";
import DebateStatus from "./DebateStatus";
import DebateTimer from "./DebateTimer";
import AudioControls from "./AudioControls";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface DebateRoomProps {
  debateState: DebateState;
  onUpdateDebateState: (state: DebateState) => void;
  onEndDebate: () => void;
}

export default function DebateRoom({ 
  debateState, 
  onUpdateDebateState,
  onEndDebate 
}: DebateRoomProps) {
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Automatically hide sidebar on mobile
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [isMobile]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (debateState.isTimerRunning && debateState.timeRemaining > 0) {
      timer = setInterval(() => {
        onUpdateDebateState({
          ...debateState,
          timeRemaining: debateState.timeRemaining - 1
        });
      }, 1000);
    } else if (debateState.timeRemaining === 0 && debateState.isTimerRunning) {
      toast({
        title: "Time's up!",
        description: "The current round has ended.",
        variant: "default",
      });
      onUpdateDebateState({
        ...debateState,
        isTimerRunning: false
      });
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [debateState, onUpdateDebateState]);

  const handleStartTimer = () => {
    onUpdateDebateState({
      ...debateState,
      isTimerRunning: true
    });
  };

  const handlePauseTimer = () => {
    onUpdateDebateState({
      ...debateState,
      isTimerRunning: false
    });
  };

  const handleResetTimer = () => {
    // Reset to the original time for the current round
    const originalTime = 240; // Example: 4 minutes for constructive
    onUpdateDebateState({
      ...debateState,
      timeRemaining: originalTime,
      isTimerRunning: false
    });
  };

  const handleRequestPrepTime = (team: TeamType) => {
    const prepTimeRemaining = { ...debateState.prepTimeRemaining };
    
    if (prepTimeRemaining[team] > 0) {
      toast({
        title: `Team ${team.substring(1)} Prep Time`,
        description: `${prepTimeRemaining[team]} seconds of prep time remaining`,
      });
      
      onUpdateDebateState({
        ...debateState,
        currentRound: 'Preparation',
        isTimerRunning: true,
        // Set the timer to the remaining prep time
        timeRemaining: prepTimeRemaining[team]
      });
    } else {
      toast({
        title: "No Prep Time Left",
        description: `Team ${team.substring(1)} has used all their prep time`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Sidebar for debate status */}
      {showSidebar && (
        <div className="w-full max-w-xs bg-white border-r border-gray-200 p-4">
          <div className="space-y-4">
            <DebateStatus debateState={debateState} />
            
            <DebateTimer
              timeRemaining={debateState.timeRemaining}
              isRunning={debateState.isTimerRunning}
              onStart={handleStartTimer}
              onPause={handlePauseTimer}
              onReset={handleResetTimer}
              prepTimeRemaining={debateState.prepTimeRemaining}
              onRequestPrepTime={handleRequestPrepTime}
              activeTeam={debateState.currentRound === 'Preparation' ? 'T1' : null}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="h-10 w-10"
          >
            <Grid className="h-4 w-4" />
          </Button>
          
          <h1 className="text-xl font-bold">
            {debateState.currentRound} Round
          </h1>
          
          <Button
            variant="outline"
            onClick={onEndDebate}
          >
            End Debate
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <TranscriptionPanel messages={debateState.transcriptions} />
          </div>
          
          <div className="space-y-4">
            <AudioControls />
            
            <div className="debate-card">
              <h2 className="text-lg font-medium mb-4">Current Speakers</h2>
              <div className="grid grid-cols-2 gap-4">
                <DebaterAvatar 
                  speaker={debateState.speakers.A} 
                  isSpeaking={debateState.currentSpeaker === 'A'}
                />
                <DebaterAvatar 
                  speaker={debateState.speakers.C}
                  isSpeaking={debateState.currentSpeaker === 'C'} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
