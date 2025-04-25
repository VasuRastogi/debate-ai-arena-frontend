
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ModeSelectionProps {
  onSelectMode: (mode: 'single-player' | 'multiplayer', name: string, teammate?: string) => void;
}

export default function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  const [mode, setMode] = useState<'single-player' | 'multiplayer'>('single-player');
  const [name, setName] = useState('');
  const [teammate, setTeammate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (mode === 'multiplayer' && !teammate.trim()) {
      setError('Please enter your teammate\'s name');
      return;
    }

    onSelectMode(mode, name, teammate);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Debate AI Arena</CardTitle>
          <CardDescription>Select your debate mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            defaultValue={mode}
            onValueChange={(value) => setMode(value as 'single-player' | 'multiplayer')}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single-player" id="single" />
              <Label htmlFor="single" className="cursor-pointer">
                <div>
                  <h3 className="font-medium">Single Player Mode</h3>
                  <p className="text-sm text-gray-500">You debate with AI teammates against AI opponents</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multiplayer" id="multi" />
              <Label htmlFor="multi" className="cursor-pointer">
                <div>
                  <h3 className="font-medium">Multiplayer Mode</h3>
                  <p className="text-sm text-gray-500">You and a friend debate against AI opponents</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="debate-input mt-1"
              />
            </div>

            {mode === 'multiplayer' && (
              <div>
                <Label htmlFor="teammate">Teammate's Name</Label>
                <Input
                  id="teammate"
                  placeholder="Enter your teammate's name"
                  value={teammate}
                  onChange={(e) => setTeammate(e.target.value)}
                  className="debate-input mt-1"
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            className="debate-btn-accent w-full"
          >
            Start Debate
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
