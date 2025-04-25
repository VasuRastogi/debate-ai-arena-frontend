
import { useRef, useEffect } from "react";
import { TranscriptionMessage } from "@/types/debate";
import { cn } from "@/lib/utils";

interface TranscriptionPanelProps {
  messages: TranscriptionMessage[];
}

export default function TranscriptionPanel({ messages }: TranscriptionPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getBubbleClass = (speaker: string) => {
    if (speaker === 'moderator' || speaker === 'judge') {
      return "transcript-bubble-system";
    }
    if (['A', 'B'].includes(speaker)) {
      return "transcript-bubble-user";
    }
    return "transcript-bubble-ai";
  };

  const getSpeakerName = (speaker: string) => {
    if (speaker === 'moderator') return "Moderator";
    if (speaker === 'judge') return "Judge";
    return `Player ${speaker}`;
  };

  return (
    <div className="debate-card">
      <h2 className="text-lg font-medium mb-3">Transcript</h2>
      <div className="transcript-container">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>Transcript will appear here...</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  getBubbleClass(msg.speaker)
                )}
              >
                <div className="text-xs opacity-70 mb-1">
                  {getSpeakerName(msg.speaker)}
                </div>
                <div>{msg.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
