
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLiveKit } from "./LiveKitProvider";
import { Mic, MicOff } from "lucide-react";

export default function AudioControls() {
  const { toggleMute, isMuted } = useLiveKit();
  const [volume, setVolume] = useState(80);
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    
    // Set audio output volume for all audio elements
    document.querySelectorAll("audio").forEach(audio => {
      audio.volume = value[0] / 100;
    });
  };
  
  return (
    <div className="debate-card">
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-medium mb-4">Audio Controls</h2>
        
        <Button
          onClick={toggleMute}
          className={isMuted ? "debate-btn-danger" : "debate-btn-accent"}
          variant="outline"
          size="lg"
        >
          {isMuted ? (
            <>
              <MicOff className="w-6 h-6 mr-2" />
              <span>Unmute</span>
            </>
          ) : (
            <>
              <Mic className="w-6 h-6 mr-2" />
              <span>Mute</span>
            </>
          )}
        </Button>
        
        <div className="mt-6 w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Volume</span>
            <span className="text-sm">{volume}%</span>
          </div>
          <Slider
            defaultValue={[volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}
