
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Square, Play, Languages, MessageSquare, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VoiceService } from "@/services/voiceService";
import { GeminiService } from "@/services/geminiService";
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
  const [conversationMode, setConversationMode] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");

  useEffect(() => {
    // Set up voice interruption callback
    VoiceService.setInterruptionCallback(() => {
      console.log('Voice interruption triggered');
      VoiceService.stopSpeaking();
      setIsPlaying(false);
      toast({
        title: "🤫 Voice Stopped",
        description: "Speech interrupted by voice command",
      });
    });

    return () => {
      VoiceService.setInterruptionCallback(null);
      VoiceService.stopContinuousListening();
    };
  }, []);

  const startListening = async () => {
    try {
      onListeningChange(true);
      const transcript = await VoiceService.startListening(selectedLanguage);
      
      if (transcript === 'stop') {
        onListeningChange(false);
        return;
      }
      
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

  const startConversationMode = async () => {
    try {
      setConversationMode(true);
      
      // Start with a greeting
      const greeting = "Hello! I'm your AI study assistant. I'm ready to help you with any academic questions. What would you like to learn about today?";
      await VoiceService.speakResponse(greeting, selectedLanguage);
      
      // Start continuous listening for natural conversation
      await VoiceService.startContinuousListening(selectedLanguage);
      onListeningChange(true);
      
      toast({
        title: "🎙️ Conversation Mode Active",
        description: "Say 'stop' anytime to interrupt or pause",
      });
      
    } catch (error) {
      console.error('Conversation mode error:', error);
      setConversationMode(false);
      toast({
        title: "Conversation Error",
        description: "Could not start conversation mode",
        variant: "destructive"
      });
    }
  };

  const stopConversationMode = () => {
    setConversationMode(false);
    VoiceService.stopContinuousListening();
    VoiceService.stopSpeaking();
    onListeningChange(false);
    setIsPlaying(false);
    
    toast({
      title: "🔇 Conversation Ended",
      description: "Voice conversation mode disabled",
    });
  };

  const processVoiceInput = async (userInput: string) => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    try {
      // Check if user wants to stop
      const lowerInput = userInput.toLowerCase().trim();
      if (['stop', 'pause', 'quiet', 'silence', 'enough'].some(word => lowerInput.includes(word))) {
        VoiceService.stopSpeaking();
        setIsPlaying(false);
        if (conversationMode) {
          stopConversationMode();
        }
        return;
      }

      // Generate intelligent AI response using Gemini
      let aiResponse: string;
      
      if (GeminiService.hasApiKey()) {
        aiResponse = await GeminiService.generateResponse(userInput);
      } else {
        aiResponse = `I understand you're asking about "${userInput}". For the most comprehensive and intelligent responses across all academic subjects, please set up your Gemini API key. I can help with Math, Science, Programming, Engineering, and much more with advanced AI capabilities!`;
      }
      
      setCurrentResponse(aiResponse);
      
      // Create conversation entry
      const newConversation: VoiceConversation = {
        id: Date.now().toString(),
        userInput,
        botResponse: aiResponse,
        timestamp: new Date()
      };
      
      setConversations(prev => [...prev, newConversation]);
      
      // Speak the AI response with natural flow
      setIsPlaying(true);
      await VoiceService.speakResponse(aiResponse, selectedLanguage);
      setIsPlaying(false);
      
      // In conversation mode, continue listening after response
      if (conversationMode && VoiceService.isListening()) {
        toast({
          title: "🎤 Listening...",
          description: "Continue speaking or say 'stop' to end",
        });
      }
      
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
      setIsPlaying(true);
      await VoiceService.speakResponse(response, selectedLanguage);
      setIsPlaying(false);
    } catch (error) {
      setIsPlaying(false);
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
    setCurrentResponse("");
    setIsPlaying(false);
    setConversations([]);
    if (conversationMode) {
      stopConversationMode();
    }
    VoiceService.stopSpeaking();
    toast({
      title: "Cleared",
      description: "Voice data cleared",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Mic className="h-16 w-16 text-orange-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold mb-2">Intelligent Voice Assistant</h3>
        <p className="text-gray-600">Have natural conversations with AI - just speak and get intelligent responses</p>
      </div>

      {/* Voice Settings & Conversation Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Voice Settings & Conversation Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
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
            </div>
            
            {!conversationMode ? (
              <Button 
                onClick={startConversationMode}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Natural Conversation
              </Button>
            ) : (
              <Button 
                onClick={stopConversationMode}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Pause className="h-4 w-4 mr-2" />
                End Conversation
              </Button>
            )}
          </div>
          
          {conversationMode && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>🎙️ Conversation Mode Active:</strong> I'm listening continuously. 
                Just speak naturally and I'll respond intelligently. Say "stop" anytime to interrupt or pause.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Recording Interface */}
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="relative mb-6">
            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${
              conversationMode && isListening
                ? "bg-gradient-to-r from-green-500 to-blue-500 animate-pulse scale-110" 
                : isListening 
                ? "bg-gradient-to-r from-red-500 to-orange-500 animate-pulse scale-110" 
                : isProcessing
                ? "bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"
                : isPlaying
                ? "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                : "bg-gradient-to-r from-orange-500 to-red-600 hover:scale-105"
            }`}>
              {isListening ? (
                <MicOff className="h-12 w-12 text-white" />
              ) : isProcessing ? (
                <Volume2 className="h-12 w-12 text-white animate-pulse" />
              ) : isPlaying ? (
                <Volume2 className="h-12 w-12 text-white animate-bounce" />
              ) : (
                <Mic className="h-12 w-12 text-white" />
              )}
            </div>
            
            {(isListening || isProcessing || isPlaying) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-40 h-40 rounded-full border-4 animate-ping ${
                  conversationMode && isListening ? 'border-green-300' :
                  isListening ? 'border-red-300' :
                  isProcessing ? 'border-blue-300' :
                  'border-purple-300'
                }`}></div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!conversationMode && !isListening && !isProcessing && !isPlaying ? (
              <Button
                onClick={startListening}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Mic className="h-5 w-5 mr-2" />
                Ask AI a Question
              </Button>
            ) : conversationMode && isListening ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-2 h-8 bg-green-500 rounded animate-pulse"></div>
                  <div className="w-2 h-12 bg-green-500 rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-6 bg-green-500 rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-10 bg-green-500 rounded animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                  <div className="w-2 h-4 bg-green-500 rounded animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <p className="text-green-600 font-medium animate-pulse">🎙️ Listening for your question...</p>
                <p className="text-sm text-gray-600">Say "stop" to interrupt or pause</p>
              </div>
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
            ) : isProcessing ? (
              <div className="space-y-2">
                <p className="text-blue-600 font-medium animate-pulse">🧠 Processing your question...</p>
                <p className="text-sm text-gray-500">Generating intelligent response</p>
              </div>
            ) : isPlaying ? (
              <div className="space-y-2">
                <p className="text-purple-600 font-medium animate-pulse">🔊 AI is responding...</p>
                <p className="text-sm text-gray-500">Say "stop" to interrupt</p>
                <Button
                  onClick={() => VoiceService.stopSpeaking()}
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Speaking
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Last Recorded Text */}
      {recordedText && (
        <Card className="bg-orange-50 border-orange-200 animate-fade-in">
          <CardContent className="p-6">
            <h4 className="font-medium text-orange-800 mb-3">📝 Last Question</h4>
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
                    Replay Question
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current AI Response */}
      {currentResponse && (
        <Card className="bg-purple-50 border-purple-200 animate-fade-in">
          <CardContent className="p-6">
            <h4 className="font-medium text-purple-800 mb-3">🤖 AI Response</h4>
            <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
              <p className="text-gray-800">{currentResponse}</p>
            </div>
            <Button
              onClick={() => replayResponse(currentResponse)}
              disabled={isPlaying}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {isPlaying ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Replay Response
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Voice Conversation History */}
      {conversations.length > 0 && (
        <Card className="bg-blue-50 border-blue-200 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversations.slice(-5).map((conv) => (
              <div key={conv.id} className="bg-white p-4 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Mic className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-600 font-medium">You asked:</p>
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
                      disabled={isPlaying}
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

      {/* Clear All Button */}
      {(conversations.length > 0 || recordedText) && (
        <div className="text-center">
          <Button
            onClick={clearRecording}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Clear All Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
