
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, MessageSquare, Mic, MicOff, Volume2, Upload, Languages, Brain, FileText, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ChatInterface from "@/components/ChatInterface";
import OCRUpload from "@/components/OCRUpload";
import VoiceRecorder from "@/components/VoiceRecorder";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
  const [activeFeature, setActiveFeature] = useState<string>("chat");
  const [extractedText, setExtractedText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const features = [
    {
      id: "chat",
      title: "AI Chat Assistant",
      description: "Ask questions and get instant answers",
      icon: MessageSquare,
      color: "bg-gradient-to-br from-blue-500 to-purple-600"
    },
    {
      id: "ocr",
      title: "Image to Text",
      description: "Extract text from images and documents",
      icon: Camera,
      color: "bg-gradient-to-br from-green-500 to-teal-600"
    },
    {
      id: "voice",
      title: "Voice Assistant",
      description: "Speak your questions naturally",
      icon: Mic,
      color: "bg-gradient-to-br from-orange-500 to-red-600"
    },
    {
      id: "summarize",
      title: "Smart Summary",
      description: "Get concise summaries of any text",
      icon: FileText,
      color: "bg-gradient-to-br from-purple-500 to-pink-600"
    }
  ];

  const handleFeatureClick = (featureId: string) => {
    setActiveFeature(featureId);
    toast({
      title: "Feature Selected",
      description: `Switched to ${features.find(f => f.id === featureId)?.title}`,
    });
  };

  // Get the current active feature
  const currentFeature = features.find(f => f.id === activeFeature);
  const CurrentIcon = currentFeature?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Brain className="h-16 w-16 text-blue-600 animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              EduBot
            </h1>
            <p className="text-xl text-gray-600 mb-2">Your AI-Powered Study Companion</p>
            <p className="text-gray-500">Extract, Summarize, Learn, and Interact with AI</p>
            <Badge variant="secondary" className="mt-4 animate-bounce">
              ✨ Powered by Advanced AI
            </Badge>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                isActive={activeFeature === feature.id}
                onClick={() => handleFeatureClick(feature.id)}
                delay={index * 100}
              />
            ))}
          </div>

          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
              <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  {CurrentIcon && (
                    <CurrentIcon className="h-8 w-8 text-blue-600" />
                  )}
                  {currentFeature?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {activeFeature === "chat" && (
                  <ChatInterface extractedText={extractedText} />
                )}
                
                {activeFeature === "ocr" && (
                  <OCRUpload onTextExtracted={setExtractedText} />
                )}
                
                {activeFeature === "voice" && (
                  <VoiceRecorder 
                    isListening={isListening}
                    onListeningChange={setIsListening}
                  />
                )}
                
                {activeFeature === "summarize" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
                      <h3 className="text-xl font-semibold mb-2">Smart Text Summarization</h3>
                      <p className="text-gray-600">Paste any text to get an intelligent summary</p>
                    </div>
                    
                    <Textarea
                      placeholder="Paste your text here to summarize..."
                      className="min-h-32 resize-none border-2 border-dashed border-purple-200 focus:border-purple-500 transition-colors"
                    />
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
                      size="lg"
                    >
                      <Brain className="h-5 w-5 mr-2" />
                      Generate Summary
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Upload & Extract</h3>
              <p className="text-gray-600">Upload images or documents to extract text instantly</p>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Processing</h3>
              <p className="text-gray-600">Advanced AI analyzes and processes your content</p>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: "600ms" }}>
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Languages className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Multi-language</h3>
              <p className="text-gray-600">Get responses in your preferred language</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
