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
        <h3 className="text-2xl font-bold mb-3 text-foreground">Intelligent Voice Assistant</h3>
        <p className="text-lg font-semibold text-foreground bg-accent/50 p-3 rounded-lg border">
          Have natural conversations with AI - just speak and get intelligent responses
        </p>
      </div>

      {/* Enhanced User Instructions with High Contrast */}
      <Card className="bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-600 border-2 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-700 dark:text-blue-300 mt-0.5 flex-shrink-0" />
            <div className="space-y-3">
              <h4 className="font-bold text-blue-900 dark:text-blue-100 text-xl">How to Use Voice Assistant</h4>
              <div className="space-y-3 text-blue-800 dark:text-blue-200">
                <div className="flex items-center gap-3 bg-white/50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                  <span className="text-2xl">🎤</span> 
                  <div>
                    <p className="font-bold text-lg">Say your question out loud</p>
                    <p className="text-base">Ask anything academic!</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                  <span className="text-2xl">🛑</span> 
                  <div>
                    <p className="font-bold text-lg">Say "Stop", "Pause", or "That's enough"</p>
                    <p className="text-base">to interrupt</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                  <span className="text-2xl">📄</span> 
                  <div>
                    <p className="font-bold text-lg">Download conversation</p>
                    <p className="text-base">using the button below</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                  <span className="text-2xl">🔄</span> 
                  <div>
                    <p className="font-bold text-lg">Use Conversation Mode</p>
                    <p className="text-base">for natural back-and-forth chat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings & Conversation Mode - Enhanced Styling */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Languages className="h-6 w-6" />
            Voice Settings & Conversation Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3">
              <label className="text-lg font-bold text-foreground">Language:</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-56 h-14 bg-card border-3 border-primary/40 text-foreground font-bold shadow-lg hover:bg-accent/80 transition-colors focus:border-primary focus:ring-4 focus:ring-primary/30 text-lg">
                  <SelectValue className="font-bold text-lg" />
                </SelectTrigger>
                <SelectContent className="bg-card border-3 border-primary/40 shadow-2xl z-50">
                  {VoiceService.getAvailableLanguages().map(lang => (
                    <SelectItem 
                      key={lang.code} 
                      value={lang.code}
                      className="font-bold hover:bg-accent/90 focus:bg-accent text-foreground py-4 text-lg"
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
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold shadow-lg text-lg h-14 px-6"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Start Natural Conversation
              </Button>
            ) : (
              <Button 
                onClick={stopConversationMode}
                variant="outline"
                className="border-red-400 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950/30 font-bold text-lg h-14 px-6 border-2"
              >
                <Pause className="h-5 w-5 mr-2" />
                End Conversation
              </Button>
            )}
          </div>
          
          {conversationMode && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700 rounded-lg">
              <p className="text-base text-green-900 dark:text-green-200 font-bold">
                <strong>🎙️ Conversation Mode Active:</strong> I'm listening continuously. 
                Just speak naturally and I'll respond intelligently with the same quality as the Chat Assistant. Say "stop", "pause", or "that's enough" anytime to interrupt.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Recording Interface */}
      <Card className="text-center border-2 shadow-lg">
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
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 font-bold text-lg h-14 px-8"
                size="lg"
              >
                <Mic className="h-6 w-6 mr-2" />
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
                <p className="text-green-700 dark:text-green-300 font-bold text-xl animate-pulse">🎙️ Listening for your question...</p>
                <p className="text-base text-foreground font-bold bg-accent/50 p-3 rounded-lg">Say "stop", "pause", or "that's enough" to interrupt</p>
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
                <p className="text-red-700 dark:text-red-300 font-bold text-xl animate-pulse">🎤 Listening... Speak now!</p>
                <Button
                  onClick={stopListening}
                  variant="outline"
                  className="border-red-400 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-950/30 font-bold text-lg h-12 px-6 border-2"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              </div>
            ) : isProcessing ? (
              <div className="space-y-2">
                <p className="text-blue-700 dark:text-blue-300 font-bold text-xl animate-pulse">🧠 Processing your question...</p>
                <p className="text-base text-foreground font-bold bg-accent/50 p-3 rounded-lg">Generating intelligent response</p>
              </div>
            ) : isPlaying ? (
              <div className="space-y-2">
                <p className="text-purple-700 dark:text-purple-300 font-bold text-xl animate-pulse">🔊 AI is responding...</p>
                <p className="text-base text-foreground font-bold bg-accent/50 p-3 rounded-lg">Say "stop", "pause", or "that's enough" to interrupt</p>
                <Button
                  onClick={() => VoiceService.forceStop()}
                  variant="outline"
                  className="border-purple-400 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30 font-bold text-lg h-12 px-6 border-2"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Speaking
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Conversation History with High Contrast */}
      {conversations.length > 0 && (
        <Card className="bg-slate-50 dark:bg-slate-950/50 border-slate-300 dark:border-slate-600 animate-fade-in border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                <span className="text-xl font-bold text-foreground">Full Conversation Transcript ({conversations.length} exchanges)</span>
              </div>
              <Button
                onClick={downloadTranscript}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg text-lg h-12 px-6"
                size="sm"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Transcript
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {conversations.map((conv) => (
              <div key={conv.id} className="bg-card p-5 rounded-lg border-2 shadow-md">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-blue-700 dark:text-blue-300 font-bold mb-2">You asked:</p>
                      <p className="text-foreground font-semibold bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700 text-base">{conv.userInput}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(conv.userInput)}
                      className="hover:bg-accent h-10 w-10"
                      title="Copy question"
                    >
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-purple-700 dark:text-purple-300 font-bold mb-2">EduBot responded:</p>
                      <div className="text-foreground font-semibold bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-700 max-h-40 overflow-y-auto text-base">
                        <p className="whitespace-pre-wrap">{conv.botResponse}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => replayResponse(conv.botResponse)}
                        disabled={isPlaying}
                        className="hover:bg-accent h-10 w-10"
                        title="Replay response"
                      >
                        <Volume2 className="h-5 w-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(conv.botResponse)}
                        className="hover:bg-accent h-10 w-10"
                        title="Copy response"
                      >
                        <Copy className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground font-bold bg-muted/50 p-3 rounded-lg border">
                    📅 {conv.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Last Recorded Text with High Contrast */}
      {recordedText && (
        <Card className="bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-600 animate-fade-in border-2 shadow-lg">
          <CardContent className="p-6">
            <h4 className="font-bold text-orange-900 dark:text-orange-200 mb-4 text-xl">📝 Last Question</h4>
            <div className="bg-card p-5 rounded-lg border-2 border-orange-300 dark:border-orange-600 mb-4">
              <p className="text-foreground font-semibold text-base">{recordedText}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={playRecording}
                disabled={isPlaying}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg h-12"
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="h-5 w-5 mr-2 animate-pulse" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Replay Question
                  </>
                )}
              </Button>
              <Button
                onClick={() => translateAndSpeak(recordedText)}
                variant="outline"
                className="border-orange-400 dark:border-orange-500 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-950/30 font-bold text-lg h-12 px-6 border-2"
              >
                <Languages className="h-5 w-5 mr-2" />
                Translate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current AI Response with High Contrast */}
      {currentResponse && (
        <Card className="bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-600 animate-fade-in border-2 shadow-lg">
          <CardContent className="p-6">
            <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-4 text-xl">🤖 AI Response (Chat Assistant Quality)</h4>
            <div className="bg-card p-5 rounded-lg border-2 border-purple-300 dark:border-purple-600 mb-4 max-h-64 overflow-y-auto">
              <p className="text-foreground font-semibold whitespace-pre-wrap text-base">{currentResponse}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => replayResponse(currentResponse)}
                disabled={isPlaying}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-lg h-12 px-6"
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="h-5 w-5 mr-2 animate-pulse" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Replay Response
                  </>
                )}
              </Button>
              <Button
                onClick={() => copyToClipboard(currentResponse)}
                variant="outline"
                className="border-purple-400 dark:border-purple-500 text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-950/30 font-bold text-lg h-12 px-6 border-2"
              >
                <Copy className="h-5 w-5 mr-2" />
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
            className="border-2 border-border text-foreground hover:bg-accent font-bold text-lg h-12 px-8"
          >
            Clear All Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
