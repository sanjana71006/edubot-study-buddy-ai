import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Volume2, Copy, Languages } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIService } from "@/services/aiService";
import { VoiceService } from "@/services/voiceService";
import { TranslationService } from "@/services/translationService";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatInterfaceProps {
  extractedText?: string;
}

const ChatInterface = ({ extractedText }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm EduBot, your AI study companion. Ask me questions about any topic, upload images for OCR, or let me help you summarize content!",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize AI service
    AIService.initialize().then(() => {
      setIsInitialized(true);
    }).catch(error => {
      console.error('Failed to initialize AI service:', error);
      toast({
        title: "AI Service",
        description: "AI models are loading in the background. Some features may take a moment to activate.",
      });
    });
  }, []);

  const simulateTyping = async (response: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: response,
      sender: "bot",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    try {
      let response: string;
      
      if (extractedText) {
        response = await AIService.generateResponse(currentInput, extractedText);
      } else {
        response = await AIService.generateResponse(currentInput);
      }
      
      await simulateTyping(response);
    } catch (error) {
      console.error('Error generating response:', error);
      await simulateTyping("I apologize, but I'm having trouble processing your request right now. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  const speakMessage = async (content: string) => {
    try {
      await VoiceService.speak(content);
      toast({
        title: "Speaking...",
        description: "Playing audio response",
      });
    } catch (error) {
      console.error('Speech synthesis error:', error);
      toast({
        title: "Audio Error",
        description: "Could not play audio response",
        variant: "destructive"
      });
    }
  };

  const translateMessage = async (content: string) => {
    try {
      const translated = await TranslationService.translateText(content, 'es'); // Default to Spanish
      toast({
        title: "Translation",
        description: `Spanish: ${translated}`,
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Error",
        description: "Could not translate message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {extractedText && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <Badge variant="secondary" className="mb-2">Extracted Text Context</Badge>
            <p className="text-sm text-gray-700">{extractedText.substring(0, 200)}...</p>
          </CardContent>
        </Card>
      )}

      {!isInitialized && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <Badge variant="secondary" className="mb-2">Loading AI Models</Badge>
            <p className="text-sm text-gray-700">AI models are initializing. This may take a moment...</p>
          </CardContent>
        </Card>
      )}

      <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === "user"
                    ? "bg-blue-500"
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                }`}
              >
                {message.sender === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              
              <div className="group relative">
                <div
                  className={`p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  {message.content}
                </div>
                
                {message.sender === "bot" && (
                  <div className="flex space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyMessage(message.content)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => speakMessage(message.content)}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => translateMessage(message.content)}
                    >
                      <Languages className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your studies..."
          className="flex-1 border-2 border-gray-200 focus:border-blue-500 transition-colors"
        />
        <Button
          onClick={handleSendMessage}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          disabled={!inputValue.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;
