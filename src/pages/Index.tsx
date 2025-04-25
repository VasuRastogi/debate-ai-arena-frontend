
import { useState, useEffect } from "react";
import { LiveKitProvider } from "@/components/LiveKitProvider";
import { toast } from "@/hooks/use-toast";
import ModeSelection from "@/components/ModeSelection";
import DebateRoom from "@/components/DebateRoom";
import ResultsScreen from "@/components/ResultsScreen";
import { DebateState, DebateMode } from "@/types/debate";
import { generateTestDebate, generateTestResults, generateSampleTranscript } from "@/data/testData";

const Index = () => {
  const [screen, setScreen] = useState<"mode-selection" | "debate-room" | "results">(
    "mode-selection"
  );
  const [debateState, setDebateState] = useState<DebateState | null>(null);
  const [debateMode, setDebateMode] = useState<DebateMode>("single-player");
  const [userName, setUserName] = useState("");
  const [teammateName, setTeammateName] = useState("");

  // Mocked connection state for LiveKit (would be replaced with actual LiveKit connection)
  const [liveKitConnected, setLiveKitConnected] = useState(false);

  const handleSelectMode = (
    mode: DebateMode,
    name: string,
    teammate?: string
  ) => {
    setDebateMode(mode);
    setUserName(name);
    if (teammate) setTeammateName(teammate);

    // In a real app, we would connect to LiveKit here
    toast({
      title: "Connecting to debate room...",
      description: "Please wait while we set up your debate.",
    });

    // Simulate connection delay
    setTimeout(() => {
      // Generate test debate state
      const initialDebateState = generateTestDebate(mode, name, teammate);
      
      // Add sample transcript for demonstration
      initialDebateState.transcriptions = generateSampleTranscript();
      
      setDebateState(initialDebateState);
      setLiveKitConnected(true);
      setScreen("debate-room");
      
      toast({
        title: "Connected successfully!",
        description: `You've joined as ${name} on Team 1.`,
        variant: "default",
      });
    }, 1500);
  };

  const handleUpdateDebateState = (newState: DebateState) => {
    setDebateState(newState);
  };

  const handleEndDebate = () => {
    if (!debateState) return;
    
    toast({
      title: "Ending debate...",
      description: "Calculating final scores and results.",
    });
    
    // Generate test results
    const resultsState = generateTestResults(debateState);
    setDebateState(resultsState);
    setScreen("results");
  };

  const handleStartNewDebate = () => {
    setScreen("mode-selection");
    setDebateState(null);
  };

  return (
    <LiveKitProvider>
      {screen === "mode-selection" && (
        <ModeSelection onSelectMode={handleSelectMode} />
      )}
      
      {screen === "debate-room" && debateState && (
        <DebateRoom 
          debateState={debateState}
          onUpdateDebateState={handleUpdateDebateState}
          onEndDebate={handleEndDebate}
        />
      )}
      
      {screen === "results" && debateState && (
        <ResultsScreen 
          debateState={debateState}
          onStartNewDebate={handleStartNewDebate}
        />
      )}
    </LiveKitProvider>
  );
};

export default Index;
