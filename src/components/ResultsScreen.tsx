
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { DebateState } from "@/types/debate";
import { Download, RotateCcw } from "lucide-react";

interface ResultsScreenProps {
  debateState: DebateState;
  onStartNewDebate: () => void;
}

export default function ResultsScreen({ debateState, onStartNewDebate }: ResultsScreenProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadResults = () => {
    try {
      setDownloading(true);
      
      // Create a blob with the debate results
      const resultsData = JSON.stringify(debateState, null, 2);
      const blob = new Blob([resultsData], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'debate_results.json';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading results:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (!debateState.finalResults) {
    return <div>Loading results...</div>;
  }

  const { 
    winner, 
    team1TotalScore, 
    team2TotalScore, 
    feedback 
  } = debateState.finalResults;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Debate Results</CardTitle>
            <p className="text-lg font-medium mt-2">Topic: {debateState.topic}</p>
            <div className="mt-4 grid grid-cols-2 gap-8">
              <div className="text-center">
                <h2 className="text-lg debate-team-pro">Team 1 ({debateState.team1Position})</h2>
                <p className="text-3xl font-bold">{team1TotalScore} pts</p>
                {winner === 'T1' && (
                  <p className="text-green-600 font-medium mt-2">WINNER</p>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-lg debate-team-con">Team 2 ({debateState.team2Position})</h2>
                <p className="text-3xl font-bold">{team2TotalScore} pts</p>
                {winner === 'T2' && (
                  <p className="text-green-600 font-medium mt-2">WINNER</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-medium mb-2">Judge Feedback</h3>
            <p className="text-gray-700 whitespace-pre-line">{feedback}</p>
            
            <h3 className="text-xl font-medium mt-6 mb-2">Round Scores</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead className="debate-team-pro">Team 1</TableHead>
                  <TableHead className="debate-team-con">Team 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debateState.scores.map((score) => (
                  <TableRow key={score.round}>
                    <TableCell className="font-medium">{score.round}</TableCell>
                    <TableCell>{score.team1Score}</TableCell>
                    <TableCell>{score.team2Score}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="font-bold">{team1TotalScore}</TableCell>
                  <TableCell className="font-bold">{team2TotalScore}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleDownloadResults} 
                className="debate-btn-primary"
                disabled={downloading}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Results
              </Button>
              <Button 
                onClick={onStartNewDebate} 
                className="debate-btn-secondary"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Start New Debate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
