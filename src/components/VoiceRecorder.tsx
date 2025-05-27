
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Square, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VoiceService } from "@/services/voiceService";

interface VoiceRecorderProps {
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

const VoiceRecorder = ({ isListening, onListeningChange }: VoiceRecorderProps) => {
  const [recordedText, setRecordedText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const startListening = async () => {
    try {
      onListeningChange(true);
      const transcript = await VoiceService.startListening();
      
      setRecordedText(transcript);
      onListeningChange(false);
      
      toast({
        title: "Voice Recorded!",
        description: "Your speech has been transcribed successfully.",
      });
    } catch (error) {
      console.error('Speech recognition error:', error);
      onListeningChange(false);
      
      toast({
        title: "Recognition Failed",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    VoiceService.stopListening();
    onListeningChange(false);
  };

  const playRecording = async () => {
    if (recordedText) {
      try {
        setIsPlaying(true);
        await VoiceService.speak(recordedText);
        setIsPlaying(false);
        
        toast({
          title: "Playback Complete",
          description: "Audio playback finished.",
        });
      } catch (error) {
        console.error('Speech synthesis error:', error);
        setIsPlaying(false);
        
        toast({
          title: "Playback Failed",
          description: "Could not play audio. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const clearRecording = () => {
    setRecordedText("");
    setIsPlaying(false);
    VoiceService.stopSpeaking();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Mic className="h-16 w-16 text-orange-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold mb-2">Voice Assistant</h3>
        <p className="text-gray-600">Speak your questions naturally and get voice responses</p>
      </div>

      <Card className="text-center">
        <CardContent className="p-8">
          <div className="relative mb-6">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? "bg-gradient-to-r from-red-500 to-orange-500 animate-pulse scale-110" 
                : "bg-gradient-to-r from-orange-500 to-red-600 hover:scale-105"
            }`}>
              {isListening ? (
                <MicOff className="h-12 w-12 text-white" />
              ) : (
                <Mic className="h-12 w-12 text-white" />
              )}
            </div>
            
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-4 border-red-300 animate-ping"></div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!isListening ? (
              <Button
                onClick={startListening}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-2 h-8 bg-red-500 rounded animate-pulse"></div>
                  <div className="w-2 h-12 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-10 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                  <div className="w-2 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <p className="text-red-600 font-medium animate-pulse">Listening... Speak now!</p>
                <Button
                  onClick={stopListening}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {recordedText && (
        <Card className="bg-orange-50 border-orange-200 animate-fade-in">
          <CardContent className="p-6">
            <h4 className="font-medium text-orange-800 mb-3">Transcribed Text</h4>
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
              <p className="text-gray-800">{recordedText}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={playRecording}
                disabled={isPlaying}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play Response
                  </>
                )}
              </Button>
              <Button
                onClick={clearRecording}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceRecorder;
