import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Mic, MicOff, Upload, FileText, Languages, Volume2, Copy, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VoiceService } from "@/services/voiceService";
import { TranslationService } from "@/services/translationService";
import { OCRService } from "@/services/ocrService";
import { AIService } from "@/services/aiService";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your AI Study Buddy. I can help you with questions about Mathematics, Science, Physics, Chemistry, Biology, Computer Science, Programming (Java, Python, C++, JavaScript, etc.), Machine Learning, Engineering, and much more! Upload images, ask questions, or request summaries. How can I assist you today? 😊",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize AI Service when component mounts
    AIService.initialize().catch(error => {
      console.error('Failed to initialize AI Service:', error);
    });
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
      // Use the enhanced AI service for comprehensive responses
      const response = await AIService.generateResponse(userMessage, currentContext);
      addMessage(response, 'bot');
      
      // Auto-speak response
      await VoiceService.speakResponse(response);
      
      // Auto-translate if language is selected
      if (selectedLanguage) {
        const translated = await TranslationService.translateText(response, selectedLanguage);
        const langName = TranslationService.getSupportedLanguages()[selectedLanguage];
        addMessage(`🌐 ${langName} Translation:\n${translated}`, 'bot', response);
      }
      
    } catch (error) {
      console.error('AI Response Error:', error);
      addMessage("I apologize, but I encountered an error processing your request. Please try again with a different phrasing or check your internet connection.", 'bot');
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

    setIsLoading(true);
    addMessage("🧠 Creating an intelligent summary of the current content...", 'bot');

    try {
      const summary = await AIService.summarizeText(currentContext);
      setCurrentContext(summary);
      addMessage(`✅ AI-Generated Summary:\n\n${summary}`, 'bot');
      
      await VoiceService.speakResponse(summary);
      
      if (selectedLanguage) {
        const translated = await TranslationService.translateText(summary, selectedLanguage);
        const langName = TranslationService.getSupportedLanguages()[selectedLanguage];
        addMessage(`🌐 Summary in ${langName}:\n${translated}`, 'bot');
      }
      
    } catch (error) {
      addMessage("❌ Failed to create summary. Please try again.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const clearChat = () => {
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
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      {/* Header with controls */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span className="font-medium">AI Study Assistant - All Subjects</span>
            {currentContext && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Context Available
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
            >
              <Upload className="h-4 w-4 mr-1" />
              {isProcessingImage ? "Processing..." : "Upload Image"}
            </Button>
            
            <Button size="sm" variant="outline" onClick={summarizeCurrentContext}>
              <FileText className="h-4 w-4 mr-1" />
              AI Summarize
            </Button>
            
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-2 py-1 text-sm border rounded"
            >
              <option value="">No Translation</option>
              {Object.entries(TranslationService.getSupportedLanguages()).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            
            <Button size="sm" variant="outline" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.text}</div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyMessage(message.text)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => VoiceService.speakResponse(message.text)}
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                AI is processing your question...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask anything: Math, Science, Programming, Engineering, Biology, Physics, Chemistry..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={handleVoiceInput}
            variant="outline"
            size="icon"
            className={isListening ? "bg-red-100 border-red-300" : ""}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
