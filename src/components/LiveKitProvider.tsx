
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  Room, 
  RoomEvent, 
  RemoteParticipant, 
  LocalParticipant, 
  RemoteTrackPublication 
} from "livekit-client";

type LiveKitContextType = {
  room: Room | null;
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  localParticipant: LocalParticipant | null;
  remoteParticipants: RemoteParticipant[];
  isMuted: boolean;
  toggleMute: () => Promise<void>;
};

const LiveKitContext = createContext<LiveKitContextType | undefined>(undefined);

export const LiveKitProvider = ({ children }: { children: ReactNode }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  const connect = async (url: string, token: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const roomInstance = new Room();
      
      roomInstance.on(RoomEvent.ParticipantConnected, () => {
        setRemoteParticipants(Array.from(roomInstance.remoteParticipants.values()));
      });
      
      roomInstance.on(RoomEvent.ParticipantDisconnected, () => {
        setRemoteParticipants(Array.from(roomInstance.remoteParticipants.values()));
      });
      
      roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        // Handle new tracks
        if (track.kind === "audio") {
          track.attach();
        }
      });
      
      roomInstance.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setLocalParticipant(null);
        setRemoteParticipants([]);
      });
      
      await roomInstance.connect(url, token);
      setRoom(roomInstance);
      setLocalParticipant(roomInstance.localParticipant);
      setRemoteParticipants(Array.from(roomInstance.remoteParticipants.values()));
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to connect to room:', err);
      setError(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setLocalParticipant(null);
      setRemoteParticipants([]);
    }
  };

  const toggleMute = async () => {
    if (!localParticipant) return;
    
    try {
      const tracks = localParticipant.getTrackPublications();
      for (const track of tracks.values()) {
        if (track.kind === 'audio') {
          if (track.isMuted) {
            await track.unmute();
            setIsMuted(false);
          } else {
            await track.mute();
            setIsMuted(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  const value = {
    room,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
    localParticipant,
    remoteParticipants,
    isMuted,
    toggleMute
  };

  return (
    <LiveKitContext.Provider value={value}>
      {children}
    </LiveKitContext.Provider>
  );
};

export const useLiveKit = () => {
  const context = useContext(LiveKitContext);
  if (context === undefined) {
    throw new Error('useLiveKit must be used within a LiveKitProvider');
  }
  return context;
};
