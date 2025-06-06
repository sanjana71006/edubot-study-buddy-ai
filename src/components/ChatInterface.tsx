import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, Send, Mic, MicOff, Upload, FileText, Languages, Volume2, Copy, Trash2, Play, Square, Sun, Moon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VoiceService } from "@/services/voiceService";
import { TranslationService } from "@/services/translationService";
import { OCRService } from "@/services/ocrService";
import { GeminiService } from "@/services/geminiService";
import { useTheme } from "@/contexts/ThemeContext";
import FloatingBackground from "./FloatingBackground";
import GeminiKeySetup from "./GeminiKeySetup";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTranslated?: boolean;
  originalText?: string;
}

interface ChatInterfaceProps {
  extractedText?: string;
}

const ChatInterface = ({ extractedText }: ChatInterfaceProps) => {
  const { isDark, toggleTheme } = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your AI Study Buddy powered by Gemini AI. I can help you with questions about Mathematics, Science, Physics, Chemistry, Biology, Computer Science, Programming (Java, Python, C++, JavaScript, etc.), Machine Learning, Engineering, and much more! Upload images, ask questions, or request summaries. How can I assist you today? 😊",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentContext, setCurrentContext] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(GeminiService.hasApiKey());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor speaking state
  useEffect(() => {
    const checkSpeakingState = () => {
      const speaking = VoiceService.isSpeaking();
      setIsSpeaking(speaking);
      if (!speaking) {
        setSpeakingMessageId(null);
      }
    };

    const interval = setInterval(checkSpeakingState, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (extractedText) {
      setCurrentContext(extractedText);
      addMessage(`📄 Text extracted and ready for questions:\n\n${extractedText}`, 'bot');
    }
  }, [extractedText]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (text: string, sender: 'user' | 'bot', originalText?: string) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date(),
      isTranslated: !!originalText,
      originalText
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage(userMessage, 'user');
    setInputMessage("");
    setIsLoading(true);

    try {
      let response: string;
      
      if (hasGeminiKey) {
        // Use Gemini AI for advanced responses
        response = await GeminiService.generateResponse(userMessage, currentContext);
      } else {
        // Basic fallback response
        response = `I'd be happy to help with your question about "${userMessage}". For the most comprehensive and accurate answers across all academic subjects (Math, Science, Programming, etc.), please set up your Gemini API key above. This will unlock advanced AI tutoring capabilities!`;
      }
      
      addMessage(response, 'bot');
      
      // Auto-translate if language is selected (but don't auto-speak)
      if (selectedLanguage) {
        const translated = await TranslationService.translateText(response, selectedLanguage);
        const langName = TranslationService.getSupportedLanguages()[selectedLanguage];
        addMessage(`🌐 ${langName} Translation:\n${translated}`, 'bot', response);
      }
      
    } catch (error) {
      console.error('AI Response Error:', error);
      addMessage("I apologize, but I encountered an error processing your request. Please check your API key configuration and try again.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      const transcript = await VoiceService.startListening();
      setInputMessage(transcript);
      setIsListening(false);
      
      toast({
        title: "Voice Input Received",
        description: "Processing your voice command...",
      });
      
      setTimeout(() => {
        if (transcript.trim()) {
          handleSendMessage();
        }
      }, 500);
      
    } catch (error) {
      setIsListening(false);
      toast({
        title: "Voice Input Error",
        description: "Could not process voice input. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    addMessage("🔍 Extracting text from your image...", 'bot');

    try {
      const extractedText = await OCRService.extractTextFromImage(file);
      setCurrentContext(extractedText);
      addMessage(`📄 Text extracted successfully:\n\n${extractedText}`, 'bot');
      
      toast({
        title: "Text Extracted",
        description: "You can now ask questions about the extracted content",
      });
      
    } catch (error) {
      addMessage("❌ Failed to extract text from the image. Please try a clearer image.", 'bot');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const summarizeCurrentContext = async () => {
    if (!currentContext) {
      toast({
        title: "No Content",
        description: "Please provide some text or extract text from an image first",
        variant: "destructive"
      });
      return;
    }

    if (!hasGeminiKey) {
      toast({
        title: "API Key Required",
        description: "Please set up your Gemini API key for AI summarization",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    addMessage("🧠 Creating an intelligent summary with Gemini AI...", 'bot');

    try {
      const summary = await GeminiService.summarizeText(currentContext);
      setCurrentContext(summary);
      addMessage(`✅ AI-Generated Summary:\n\n${summary}`, 'bot');
      
      if (selectedLanguage) {
        const translated = await TranslationService.translateText(summary, selectedLanguage);
        const langName = TranslationService.getSupportedLanguages()[selectedLanguage];
        addMessage(`🌐 Summary in ${langName}:\n${translated}`, 'bot');
      }
      
    } catch (error) {
      addMessage("❌ Failed to create summary. Please check your API key and try again.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = async (messageId: number, text: string) => {
    try {
      // Stop any current speech first
      VoiceService.forceStop();
      setSpeakingMessageId(messageId);
      setIsSpeaking(true);
      
      await VoiceService.speakResponse(text, selectedLanguage ? `${selectedLanguage}-IN` : 'en-US');
      
    } catch (error) {
      console.error('Speech error:', error);
      toast({
        title: "Speech Error",
        description: "Could not speak the message",
        variant: "destructive"
      });
    } finally {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const stopSpeaking = () => {
    VoiceService.forceStop();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const clearChat = () => {
    // Stop any ongoing speech
    VoiceService.forceStop();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    
    setMessages([{
      id: 1,
      text: "Chat cleared! I'm ready to help with any academic question - Mathematics, Science, Programming, Engineering, Biology, Physics, Chemistry... How can I assist you today? 😊",
      sender: 'bot',
      timestamp: new Date()
    }]);
    setCurrentContext("");
    toast({
      title: "Chat Cleared",
      description: "Starting fresh conversation",
    });
  };

  return (
    <div className={`relative flex flex-col h-[600px] max-w-4xl mx-auto rounded-lg overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200'
    }`}>
      <FloatingBackground />
      
      {/* API Key Setup */}
      <div className={`relative z-10 p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50 border-b'}`}>
        <GeminiKeySetup onApiKeySet={setHasGeminiKey} />
      </div>

      {/* Header with controls */}
      <div className={`relative z-10 p-4 border-b ${
        isDark 
          ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className="font-medium">AI Study Assistant - All Subjects</span>
            {currentContext && (
              <Badge variant="secondary" className={`${
                isDark ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
              }`}>
                Context Available
              </Badge>
            )}
            {hasGeminiKey && (
              <Badge variant="secondary" className={`${
                isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                Gemini Powered
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className={`${
                    isDark 
                      ? 'border-gray-500 text-gray-200 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessingImage ? "Processing..." : "Upload Image"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload an image to extract text from documents, notes, or photos</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={summarizeCurrentContext}
                  className={`${
                    isDark 
                      ? 'border-gray-500 text-gray-200 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Smart Summary
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate an intelligent AI summary of your current content</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`px-2 py-1 text-sm border rounded ${
                    isDark 
                      ? 'border-gray-500 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  <option value="">No Translation</option>
                  {Object.entries(TranslationService.getSupportedLanguages()).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose a language for automatic translation of responses</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Global Speech Controls */}
            {isSpeaking && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={stopSpeaking}
                    className="border-red-500 text-red-400 hover:bg-red-900/20"
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop Speaking
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stop the current speech playback</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={clearChat}
                  className={`${
                    isDark 
                      ? 'border-gray-500 text-gray-200 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all messages and start a fresh conversation</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme Toggle */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300 dark:border-gray-600">
              <Sun className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-yellow-500'}`} />
              <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-blue-600"
              />
              <Moon className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className={`relative z-10 flex-1 overflow-y-auto p-4 space-y-4 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? isDark 
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-blue-500 text-white rounded-br-sm'
                  : isDark
                    ? 'bg-gray-700 text-gray-100 rounded-bl-sm border border-gray-600'
                    : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.text}</div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className={`text-xs ${isDark ? 'opacity-70' : 'opacity-60'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </span>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-6 w-6 p-0 ${
                          isDark 
                            ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => copyMessage(message.text)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy message to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {/* Individual message speech controls */}
                  {speakingMessageId === message.id ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-gray-600"
                          onClick={stopSpeaking}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Stop speaking</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-6 w-6 p-0 ${
                            isDark 
                              ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => speakMessage(message.id, message.text)}
                          disabled={isSpeaking}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Speak this message</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-lg rounded-bl-sm ${
              isDark 
                ? 'bg-gray-700 border border-gray-600' 
                : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                  isDark ? 'border-blue-400' : 'border-blue-500'
                }`}></div>
                <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                  AI is processing your question...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={`relative z-10 p-4 border-t ${
        isDark 
          ? 'border-gray-600 bg-gray-800' 
          : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask anything: Math, Science, Programming, Engineering, Biology, Physics, Chemistry..."
            className={`flex-1 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
          />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleVoiceInput}
                variant="outline"
                size="icon"
                className={`${
                  isListening 
                    ? "bg-red-600/20 border-red-500 text-red-400" 
                    : isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isListening ? "Stop voice recording" : "Start voice input"}</p>
            </TooltipContent>
          </Tooltip>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            className={`${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
