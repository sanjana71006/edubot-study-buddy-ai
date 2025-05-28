
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Square, Play, Languages, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VoiceService } from "@/services/voiceService";
import { AIService } from "@/services/aiService";
import { TranslationService } from "@/services/translationService";

interface VoiceRecorderProps {
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

interface VoiceConversation {
  id: string;
  userInput: string;
  botResponse: string;
  timestamp: Date;
}

const VoiceRecorder = ({ isListening, onListeningChange }: VoiceRecorderProps) => {
  const [recordedText, setRecordedText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversations, setConversations] = useState<VoiceConversation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");

  const startListening = async () => {
    try {
      onListeningChange(true);
      const transcript = await VoiceService.startListening(selectedLanguage);
      
      setRecordedText(transcript);
      onListeningChange(false);
      
      // Automatically process the voice input and get AI response
      await processVoiceInput(transcript);
      
      toast({
        title: "🎤 Voice Recorded!",
        description: "Processing your question...",
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

  const processVoiceInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    try {
      // Generate AI response
      const aiResponse = await AIService.generateResponse(userInput);
      
      // Create conversation entry
      const newConversation: VoiceConversation = {
        id: Date.now().toString(),
        userInput,
        botResponse: aiResponse,
        timestamp: new Date()
      };
      
      setConversations(prev => [...prev, newConversation]);
      
      // Speak the AI response
      const speechLang = selectedLanguage;
      await VoiceService.speakResponse(aiResponse, speechLang);
      
      toast({
        title: "🤖 Response Ready",
        description: "AI has responded with voice output",
      });
    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process voice input",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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
        await VoiceService.speak(recordedText, selectedLanguage);
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

  const replayResponse = async (response: string) => {
    try {
      await VoiceService.speakResponse(response, selectedLanguage);
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Could not replay response",
        variant: "destructive"
      });
    }
  };

  const translateAndSpeak = async (text: string) => {
    const targetLang = selectedLanguage.startsWith('hi') ? 'hi' : 
                      selectedLanguage.startsWith('es') ? 'es' : 'en';
    
    try {
      const translated = await TranslationService.translateText(text, targetLang);
      await VoiceService.speakResponse(translated, selectedLanguage);
      toast({
        title: "🌐 Translation Spoken",
        description: `Translated to ${TranslationService.getSupportedLanguages()[targetLang]}`,
      });
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Could not translate and speak",
        variant: "destructive"
      });
    }
  };

  const clearRecording = () => {
    setRecordedText("");
    setIsPlaying(false);
    setConversations([]);
    VoiceService.stopSpeaking();
    toast({
      title: "Cleared",
      description: "Voice data cleared",
    });
  };

  const startVoiceConversation = async () => {
    try {
      const greeting = await VoiceService.startConversation();
      setRecordedText(greeting);
      await processVoiceInput(greeting);
    } catch (error) {
      toast({
        title: "Conversation Error",
        description: "Could not start voice conversation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Mic className="h-16 w-16 text-orange-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold mb-2">Smart Voice Assistant</h3>
        <p className="text-gray-600">Speak naturally and get intelligent voice responses</p>
      </div>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Language:</label>
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              {VoiceService.getAvailableLanguages().map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <Button variant="outline" onClick={startVoiceConversation}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Conversation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Recording Interface */}
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="relative mb-6">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? "bg-gradient-to-r from-red-500 to-orange-500 animate-pulse scale-110" 
                : isProcessing
                ? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"
                : "bg-gradient-to-r from-orange-500 to-red-600 hover:scale-105"
            }`}>
              {isListening ? (
                <MicOff className="h-12 w-12 text-white" />
              ) : isProcessing ? (
                <Volume2 className="h-12 w-12 text-white animate-pulse" />
              ) : (
                <Mic className="h-12 w-12 text-white" />
              )}
            </div>
            
            {(isListening || isProcessing) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-4 border-red-300 animate-ping"></div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!isListening && !isProcessing ? (
              <Button
                onClick={startListening}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Voice Chat
              </Button>
            ) : isListening ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-2 h-8 bg-red-500 rounded animate-pulse"></div>
                  <div className="w-2 h-12 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-10 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                  <div className="w-2 h-4 bg-red-500 rounded animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <p className="text-red-600 font-medium animate-pulse">🎤 Listening... Speak now!</p>
                <Button
                  onClick={stopListening}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-blue-600 font-medium animate-pulse">🧠 Processing your question...</p>
                <p className="text-sm text-gray-500">Generating intelligent response</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Recorded Text */}
      {recordedText && (
        <Card className="bg-orange-50 border-orange-200 animate-fade-in">
          <CardContent className="p-6">
            <h4 className="font-medium text-orange-800 mb-3">📝 Last Recorded</h4>
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
                    Replay
                  </>
                )}
              </Button>
              <Button
                onClick={() => translateAndSpeak(recordedText)}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Languages className="h-4 w-4 mr-2" />
                Translate
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

      {/* Voice Conversation History */}
      {conversations.length > 0 && (
        <Card className="bg-blue-50 border-blue-200 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Voice Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversations.map((conv) => (
              <div key={conv.id} className="bg-white p-4 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Mic className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-600 font-medium">You said:</p>
                      <p className="text-gray-800">{conv.userInput}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-purple-600 font-medium">AI responded:</p>
                      <p className="text-gray-800">{conv.botResponse}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => replayResponse(conv.botResponse)}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">{conv.timestamp.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceRecorder;
