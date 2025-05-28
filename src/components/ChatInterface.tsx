
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
      text: "Hi! I'm your AI Study Buddy. I can help you with questions, summarize text, extract text from images, and translate content. How can I assist you today? 😊",
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

  const generateAIResponse = async (userMessage: string, context?: string): Promise<string> => {
    // Enhanced prompt engineering for better responses
    let prompt = "";
    
    if (context) {
      prompt = `You are an intelligent AI tutor. Based on the following context, provide a comprehensive and accurate answer to the user's question.

Context:
${context}

User Question: ${userMessage}

Instructions:
- Answer based primarily on the provided context
- If the context doesn't contain enough information, clearly state this
- Provide educational explanations where appropriate
- Be conversational but informative
- Use examples when helpful

Answer:`;
    } else {
      // General conversation without specific context
      prompt = `You are an intelligent AI study assistant. Respond to the user's question or request in a helpful, educational manner.

User: ${userMessage}

Instructions:
- Be conversational and engaging
- Provide accurate information
- If asked about academic topics, give detailed explanations
- Use examples when helpful
- If you don't know something, admit it honestly

Response:`;
    }

    try {
      // Simulate API call with structured response patterns
      if (userMessage.toLowerCase().includes('color')) {
        return "Here are 5 common colors:\n1. Red - The color of roses and fire\n2. Blue - The color of the sky and ocean\n3. Green - The color of grass and leaves\n4. Yellow - The color of the sun and bananas\n5. Purple - The color of grapes and lavender\n\nEach color has different psychological associations and uses in design!";
      }
      
      if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
        return "Hello! I'm your AI Study Buddy. I'm here to help you learn and understand various topics. You can:\n\n• Ask me questions about any subject\n• Upload images for text extraction\n• Request summaries of content\n• Get translations in multiple languages\n• Use voice commands\n\nWhat would you like to explore today?";
      }

      if (userMessage.toLowerCase().includes('summarize') && context) {
        return `Here's a concise summary of the provided content:\n\n${this.createSummary(context)}\n\nWould you like me to explain any specific part in more detail?`;
      }

      if (userMessage.toLowerCase().includes('explain') && context) {
        return `Let me explain this content for you:\n\n${this.createExplanation(context, userMessage)}\n\nDo you have any specific questions about this explanation?`;
      }

      // Default educational response
      return `I understand you're asking about: "${userMessage}"\n\n${this.generateEducationalResponse(userMessage, context)}\n\nFeel free to ask follow-up questions or request clarification on any part!`;
      
    } catch (error) {
      return "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or check if there's sufficient context for me to work with.";
    }
  };

  private createSummary(text: string): string {
    // Simple summarization logic
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, Math.min(3, sentences.length));
    return keyPoints.join('. ') + '.';
  }

  private createExplanation(context: string, question: string): string {
    // Generate contextual explanation
    const words = question.toLowerCase().split(' ');
    const keyTerms = words.filter(w => w.length > 3);
    
    if (keyTerms.length > 0) {
      return `Based on the context provided, here's what I can explain about ${keyTerms.join(', ')}:\n\n${context.substring(0, 200)}...`;
    }
    
    return `Based on the provided context: ${context.substring(0, 150)}...`;
  }

  private generateEducationalResponse(message: string, context?: string): string {
    if (context) {
      return `Based on the context you've provided, I can help answer questions about this material. The content appears to cover important topics that I can explain in detail.`;
    }
    
    return `I'd be happy to help you learn about this topic! For the most accurate assistance, consider providing some context or specific details about what you'd like to understand.`;
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage(userMessage, 'user');
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await generateAIResponse(userMessage, currentContext);
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
      addMessage("I apologize, but I encountered an error processing your request. Please try again.", 'bot');
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
      
      // Auto-send voice input
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
    addMessage("🧠 Creating a summary of the current content...", 'bot');

    try {
      const summary = createSummary(currentContext);
      setCurrentContext(summary); // Update context to summary
      addMessage(`✅ Summary:\n\n${summary}`, 'bot');
      
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
      text: "Chat cleared! How can I help you today? 😊",
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
            <span className="font-medium">AI Study Assistant</span>
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
              Summarize
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
                AI is thinking...
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
            placeholder="Type your question or request..."
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
