import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Volume2, Square, Play, Languages, MessageSquare, Pause, Download, Copy, Info } from "lucide-react";
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
    // Enhanced voice interruption callback with multiple keywords
    VoiceService.setInterruptionCallback(() => {
      console.log('Voice interruption detected - stopping speech');
      VoiceService.forceStop();
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

  // Download conversation transcript as TXT
  const downloadTranscript = () => {
    if (conversations.length === 0) {
      toast({
        title: "No Conversation",
        description: "No conversation history to download",
        variant: "destructive"
      });
      return;
    }

    const transcript = conversations.map((conv, index) => {
      return `--- Conversation ${index + 1} ---
Time: ${conv.timestamp.toLocaleString()}

You: ${conv.userInput}

EduBot: ${conv.botResponse}

`;
    }).join('\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduBot_Conversation_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "📄 Download Complete",
      description: "Conversation transcript downloaded successfully",
    });
  };

  // Copy individual response to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copied",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

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
        description: "Say 'stop', 'pause', or 'that's enough' anytime to interrupt",
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
      // Enhanced interruption keywords detection
      const lowerInput = userInput.toLowerCase().trim();
      const stopKeywords = ['stop', 'pause', 'quiet', 'silence', 'enough', "that's enough", 'halt'];
      
      if (stopKeywords.some(word => lowerInput.includes(word))) {
        VoiceService.forceStop();
        setIsPlaying(false);
        if (conversationMode) {
          stopConversationMode();
        }
        return;
      }

      // Generate intelligent AI response using Gemini - EXACTLY like Chat Assistant
      let aiResponse: string;
      
      if (GeminiService.hasApiKey()) {
        // Use the same comprehensive prompt as Chat Assistant for consistency
        const enhancedPrompt = `You are EduBot, an expert AI tutor specializing in comprehensive educational support across all academic subjects including Mathematics, Science, Physics, Chemistry, Biology, Computer Science, Programming (Java, Python, C++, JavaScript, etc.), Machine Learning, Data Science, Engineering, Literature, History, and more.

User Question: ${userInput}

Provide a detailed, educational response that:
- Gives comprehensive explanations with examples
- Shows step-by-step solutions for math/science problems
- Provides practical code examples for programming questions
- Includes real-world applications and analogies
- Uses clear, encouraging, and educational language
- Covers the topic thoroughly like a knowledgeable tutor would
- Is structured and easy to follow when spoken aloud

Answer:`;
        
        aiResponse = await GeminiService.generateResponse(enhancedPrompt);
      } else {
        aiResponse = `I understand you're asking about "${userInput}". For the most comprehensive and intelligent responses across all academic subjects, please set up your Gemini API key in the settings. I can help with Math, Science, Programming, Engineering, and much more with advanced AI capabilities when properly configured!`;
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
        <p className="text-muted-foreground">Have natural conversations with AI - just speak and get intelligent responses</p>
      </div>

      {/* Enhanced User Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 border-2">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-lg">How to Use Voice Assistant</h4>
              <div className="space-y-1 text-blue-700 dark:text-blue-300">
                <p className="flex items-center gap-2"><span className="text-xl">🎤</span> <strong>Say your question out loud</strong> - Ask anything academic!</p>
                <p className="flex items-center gap-2"><span className="text-xl">🛑</span> <strong>Say "Stop", "Pause", or "That's enough"</strong> to interrupt</p>
                <p className="flex items-center gap-2"><span className="text-xl">📄</span> <strong>Download conversation</strong> using the button below</p>
                <p className="flex items-center gap-2"><span className="text-xl">🔄</span> <strong>Use Conversation Mode</strong> for natural back-and-forth chat</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings & Conversation Mode - Enhanced Styling */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Voice Settings & Conversation Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-foreground">Language:</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-48 h-12 bg-background border-2 border-primary/20 text-foreground font-bold shadow-md hover:bg-accent/50 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <SelectValue className="font-bold" />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 border-primary/20 shadow-xl z-50">
                  {VoiceService.getAvailableLanguages().map(lang => (
                    <SelectItem 
                      key={lang.code} 
                      value={lang.code}
                      className="font-bold hover:bg-accent/80 focus:bg-accent text-foreground py-3"
                    >
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!conversationMode ? (
              <Button 
                onClick={startConversationMode}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold shadow-lg"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Natural Conversation
              </Button>
            ) : (
              <Button 
                onClick={stopConversationMode}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20 font-bold"
              >
                <Pause className="h-4 w-4 mr-2" />
                End Conversation
              </Button>
            )}
          </div>
          
          {conversationMode && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300 font-semibold">
                <strong>🎙️ Conversation Mode Active:</strong> I'm listening continuously. 
                Just speak naturally and I'll respond intelligently with the same quality as the Chat Assistant. Say "stop", "pause", or "that's enough" anytime to interrupt.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Recording Interface */}
      <Card className="text-center border-2">
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
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 font-bold"
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
                <p className="text-green-600 font-bold animate-pulse">🎙️ Listening for your question...</p>
                <p className="text-sm text-muted-foreground font-medium">Say "stop", "pause", or "that's enough" to interrupt</p>
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
                <p className="text-red-600 font-bold animate-pulse">🎤 Listening... Speak now!</p>
                <Button
                  onClick={stopListening}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 font-bold"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            ) : isProcessing ? (
              <div className="space-y-2">
                <p className="text-blue-600 font-bold animate-pulse">🧠 Processing your question...</p>
                <p className="text-sm text-muted-foreground">Generating intelligent response</p>
              </div>
            ) : isPlaying ? (
              <div className="space-y-2">
                <p className="text-purple-600 font-bold animate-pulse">🔊 AI is responding...</p>
                <p className="text-sm text-muted-foreground font-medium">Say "stop", "pause", or "that's enough" to interrupt</p>
                <Button
                  onClick={() => VoiceService.forceStop()}
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50 font-bold"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Speaking
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Conversation History with Download */}
      {conversations.length > 0 && (
        <Card className="bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 animate-fade-in border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                Full Conversation Transcript ({conversations.length} exchanges)
              </div>
              <Button
                onClick={downloadTranscript}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Transcript
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {conversations.map((conv) => (
              <div key={conv.id} className="bg-background p-4 rounded-lg border-2 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Mic className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1">You asked:</p>
                      <p className="text-foreground font-medium bg-blue-50 dark:bg-blue-950/20 p-3 rounded border">{conv.userInput}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(conv.userInput)}
                      className="hover:bg-accent"
                      title="Copy question"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-bold mb-1">EduBot responded:</p>
                      <div className="text-foreground font-medium bg-purple-50 dark:bg-purple-950/20 p-3 rounded border max-h-40 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{conv.botResponse}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => replayResponse(conv.botResponse)}
                        disabled={isPlaying}
                        className="hover:bg-accent"
                        title="Replay response"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(conv.botResponse)}
                        className="hover:bg-accent"
                        title="Copy response"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground font-medium bg-muted/30 p-2 rounded">
                    📅 {conv.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Last Recorded Text */}
      {recordedText && (
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 animate-fade-in border-2">
          <CardContent className="p-6">
            <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-3">📝 Last Question</h4>
            <div className="bg-background p-4 rounded-lg border-2 border-orange-200 dark:border-orange-800 mb-4">
              <p className="text-foreground font-medium">{recordedText}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={playRecording}
                disabled={isPlaying}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold"
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
                className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/30 font-bold"
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
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 animate-fade-in border-2">
          <CardContent className="p-6">
            <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-3">🤖 AI Response (Chat Assistant Quality)</h4>
            <div className="bg-background p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 mb-4 max-h-64 overflow-y-auto">
              <p className="text-foreground font-medium whitespace-pre-wrap">{currentResponse}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => replayResponse(currentResponse)}
                disabled={isPlaying}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold"
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
              <Button
                onClick={() => copyToClipboard(currentResponse)}
                variant="outline"
                className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/30 font-bold"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Response
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear All Button */}
      {(conversations.length > 0 || recordedText) && (
        <div className="text-center">
          <Button
            onClick={clearRecording}
            variant="outline"
            className="border-border text-muted-foreground hover:bg-accent font-bold"
          >
            Clear All Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
