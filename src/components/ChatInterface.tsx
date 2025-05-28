
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Volume2, Copy, Languages, Download, VolumeX, Mic, MicOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIService } from "@/services/aiService";
import { VoiceService } from "@/services/voiceService";
import { TranslationService } from "@/services/translationService";
import { ChatbotService } from "@/services/chatbotService";
import ApiKeySetup from "./ApiKeySetup";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  topic?: string;
}

interface ChatInterfaceProps {
  extractedText?: string;
}

const ChatInterface = ({ extractedText }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm EduBot, your AI study companion. I can help you with questions, analyze content, provide summaries, and respond with voice. What would you like to learn about today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(ChatbotService.hasApiKey());
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    AIService.initialize().then(() => {
      setIsInitialized(true);
    }).catch(error => {
      console.error('Failed to initialize AI service:', error);
      toast({
        title: "AI Service",
        description: "AI models are loading in the background.",
      });
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateTyping = async (response: string, topic?: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: response,
      sender: "bot",
      timestamp: new Date(),
      topic
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);

    // Auto-speak bot responses if enabled
    if (autoVoiceEnabled) {
      try {
        const speechLang = selectedLanguage === 'hi' ? 'hi-IN' : 
                          selectedLanguage === 'es' ? 'es-ES' : 'en-US';
        await VoiceService.speakResponse(response, speechLang);
      } catch (error) {
        console.error('Auto-voice error:', error);
      }
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      let response: string;
      let detectedTopic: string = "";
      
      if (hasApiKey) {
        // Enhanced ChatGPT mode
        let enhancedPrompt = textToSend;
        if (extractedText) {
          enhancedPrompt = `Context: "${extractedText.substring(0, 500)}..."\n\nUser Question: ${textToSend}\n\nPlease provide a helpful, accurate answer based on the context if relevant, or answer the question directly if it's general knowledge.`;
        }
        response = await ChatbotService.sendMessage(enhancedPrompt);
        detectedTopic = await AIService.detectTopic(textToSend);
      } else {
        // Improved local AI processing
        if (extractedText) {
          if (textToSend.toLowerCase().includes('summarize') || textToSend.toLowerCase().includes('summary')) {
            const result = await AIService.processImageAndSummarize(extractedText);
            response = `📚 **Summary**: ${result.summary}`;
            detectedTopic = result.topic;
          } else if (textToSend.includes('?')) {
            const result = await AIService.answerQuestion(extractedText, textToSend);
            response = `💡 **Answer**: ${result.answer}\n\n🎯 **Confidence**: ${result.confidence}%`;
            detectedTopic = result.topic;
          } else {
            response = await AIService.generateResponse(textToSend, extractedText);
            detectedTopic = await AIService.detectTopic(textToSend);
          }
        } else {
          response = await AIService.generateResponse(textToSend);
          detectedTopic = await AIService.detectTopic(textToSend);
        }
      }
      
      // Translate if needed
      if (selectedLanguage !== 'en') {
        try {
          const translatedResponse = await TranslationService.translateText(response, selectedLanguage);
          response = `${response}\n\n🌐 **Translation (${TranslationService.getSupportedLanguages()[selectedLanguage]})**: ${translatedResponse}`;
        } catch (error) {
          console.error('Translation error:', error);
        }
      }
      
      await simulateTyping(response, detectedTopic);
    } catch (error) {
      console.error('Error generating response:', error);
      await simulateTyping("I apologize, but I'm having trouble processing your request. Could you please rephrase your question or try asking something different?");
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        const speechLang = selectedLanguage === 'hi' ? 'hi-IN' : 
                          selectedLanguage === 'es' ? 'es-ES' : 'en-US';
        const transcript = await VoiceService.startListening(speechLang);
        setIsListening(false);
        
        if (transcript.trim()) {
          await handleSendMessage(transcript);
        }
      } catch (error) {
        console.error('Voice input error:', error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Could not capture voice input. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
      const speechLang = selectedLanguage === 'hi' ? 'hi-IN' : 
                        selectedLanguage === 'es' ? 'es-ES' : 'en-US';
      await VoiceService.speakResponse(content, speechLang);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      toast({
        title: "Audio Error",
        description: "Could not play audio response",
        variant: "destructive"
      });
    }
  };

  const exportConversation = () => {
    const conversation = JSON.stringify({ 
      messages: messages.filter(m => m.sender !== 'bot' || m.id !== '1'), 
      exportedAt: new Date().toISOString(),
      hasApiKey
    }, null, 2);
    
    const blob = new Blob([conversation], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edubot-conversation-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported!",
      description: "Conversation saved to downloads",
    });
  };

  return (
    <div className="space-y-4">
      <ApiKeySetup onApiKeySet={setHasApiKey} />

      {extractedText && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <Badge variant="secondary" className="mb-2">📄 Extracted Text Context</Badge>
            <p className="text-sm text-gray-700">{extractedText.substring(0, 200)}...</p>
          </CardContent>
        </Card>
      )}

      {hasApiKey && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Enhanced AI Active</Badge>
              <span className="text-sm text-green-700">Advanced conversational AI enabled</span>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs px-2 py-1 border rounded"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAutoVoiceEnabled(!autoVoiceEnabled)}
                className={autoVoiceEnabled ? "bg-blue-100" : ""}
              >
                {autoVoiceEnabled ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                Auto Voice
              </Button>
              <Button variant="outline" size="sm" onClick={exportConversation}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
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
                
                {message.topic && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {message.topic}
                  </Badge>
                )}
                
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
        <div ref={chatEndRef} />
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
          onClick={handleVoiceInput}
          variant="outline"
          className={`${isListening ? "bg-red-100 border-red-300" : ""}`}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
          onClick={() => handleSendMessage()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          disabled={!inputValue.trim() && !isListening}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;
