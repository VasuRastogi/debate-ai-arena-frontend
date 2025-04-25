
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TeamType } from "@/types/debate";

interface DebateTimerProps {
  timeRemaining: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  prepTimeRemaining?: Record<TeamType, number>;
  onRequestPrepTime?: (team: TeamType) => void;
  activeTeam?: TeamType | null;
}

export default function DebateTimer({
  timeRemaining,
  isRunning,
  onStart,
  onPause,
  onReset,
  prepTimeRemaining,
  onRequestPrepTime,
  activeTeam
}: DebateTimerProps) {
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Determine timer status class
  const getTimerClass = () => {
    if (timeRemaining <= 30) return "timer-danger";
    if (timeRemaining <= 60) return "timer-warning";
    return "timer-normal";
  };

  return (
    <div className="debate-card">
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-medium mb-2">Time Remaining</h2>
        <div 
          className={cn(
            "text-4xl font-bold mb-4",
            getTimerClass()
          )}
        >
          {formatTime(timeRemaining)}
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button 
              variant="outline" 
              className="debate-btn-primary"
              onClick={onStart}
            >
              Start
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="debate-btn-secondary"
              onClick={onPause}
            >
              Pause
            </Button>
          )}
          <Button
            variant="outline"
            className="debate-btn-secondary"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>

        {/* Prep time section */}
        {prepTimeRemaining && onRequestPrepTime && (
          <div className="mt-4 pt-4 border-t border-gray-200 w-full">
            <h3 className="text-sm font-medium mb-2">Preparation Time</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-xs mb-1 debate-team-pro">Team 1</p>
                <p className="text-sm font-medium">{formatTime(prepTimeRemaining.T1)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 text-xs"
                  disabled={prepTimeRemaining.T1 <= 0 || (activeTeam === "T1")}
                  onClick={() => onRequestPrepTime("T1")}
                >
                  {activeTeam === "T1" ? "In Prep" : "Request"}
                </Button>
              </div>
              <div className="text-center">
                <p className="text-xs mb-1 debate-team-con">Team 2</p>
                <p className="text-sm font-medium">{formatTime(prepTimeRemaining.T2)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 text-xs"
                  disabled={prepTimeRemaining.T2 <= 0 || (activeTeam === "T2")}
                  onClick={() => onRequestPrepTime("T2")}
                >
                  {activeTeam === "T2" ? "In Prep" : "Request"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
