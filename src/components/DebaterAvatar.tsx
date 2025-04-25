
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Speaker } from "@/types/debate";
import { cn } from "@/lib/utils";

interface DebaterAvatarProps {
  speaker: Speaker;
  isSpeaking: boolean;
  size?: "sm" | "md" | "lg";
}

export default function DebaterAvatar({ speaker, isSpeaking, size = "md" }: DebaterAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  };
  
  // Get initials from name
  const initials = speaker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  
  // Determine background color based on team and role
  const getBgColor = () => {
    if (speaker.team === "T1") {
      return "bg-debate-pro bg-opacity-20";
    } else {
      return "bg-debate-con bg-opacity-20";
    }
  };
  
  // Determine text color based on team
  const getTextColor = () => {
    if (speaker.team === "T1") {
      return "text-debate-pro";
    } else {
      return "text-debate-con";
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <Avatar 
        className={cn(
          sizeClasses[size], 
          getBgColor(),
          isSpeaking && "avatar-speaking"
        )}
      >
        <AvatarFallback className={getTextColor()}>
          {speaker.role}
        </AvatarFallback>
      </Avatar>
      <div className="mt-2 text-center">
        <p className="text-sm font-medium">{speaker.name}</p>
        <p 
          className={cn(
            "text-xs",
            speaker.team === "T1" ? "debate-team-pro" : "debate-team-con"
          )}
        >
          Team {speaker.team.substring(1)} {speaker.isAI ? "(AI)" : "(Human)"}
        </p>
      </div>
    </div>
  );
}
