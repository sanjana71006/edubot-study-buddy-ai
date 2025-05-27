
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, MessageSquare, Mic, MicOff, Volume2, Upload, Languages, Brain, FileText, Sparkles, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ChatInterface from "@/components/ChatInterface";
import OCRUpload from "@/components/OCRUpload";
import VoiceRecorder from "@/components/VoiceRecorder";
import LearningAnalytics from "@/components/LearningAnalytics";
import FeatureCard from "@/components/FeatureCard";
import { AIService } from "@/services/aiService";

const Index = () => {
  const [activeFeature, setActiveFeature] = useState<string>("chat");
  const [extractedText, setExtractedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [summarizeText, setSummarizeText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState("");

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
    },
    {
      id: "analytics",
      title: "Learning Analytics",
      description: "Track your study progress and insights",
      icon: BarChart3,
      color: "bg-gradient-to-br from-indigo-500 to-purple-600"
    }
  ];

  const handleFeatureClick = (featureId: string) => {
    setActiveFeature(featureId);
    toast({
      title: "Feature Selected",
      description: `Switched to ${features.find(f => f.id === featureId)?.title}`,
    });
  };

  const handleSummarize = async () => {
    if (!summarizeText.trim()) {
      toast({
        title: "No Text",
        description: "Please enter some text to summarize",
        variant: "destructive"
      });
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await AIService.summarizeText(summarizeText);
      setSummary(result);
      toast({
        title: "Summary Generated!",
        description: "Your text has been successfully summarized.",
      });
    } catch (error) {
      console.error('Summarization error:', error);
      toast({
        title: "Summarization Failed",
        description: "Could not summarize the text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
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
            <p className="text-xl text-gray-600 mb-2">Your AI-Powered Academic Companion</p>
            <p className="text-gray-500">Multi-Modal Intelligent Learning Assistant</p>
            <Badge variant="secondary" className="mt-4 animate-bounce">
              ✨ Complete Educational AI Solution
            </Badge>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
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
                
                {activeFeature === "analytics" && (
                  <LearningAnalytics />
                )}
                
                {activeFeature === "summarize" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
                      <h3 className="text-xl font-semibold mb-2">Smart Text Summarization</h3>
                      <p className="text-gray-600">Paste any academic content to get an intelligent summary</p>
                    </div>
                    
                    <Textarea
                      value={summarizeText}
                      onChange={(e) => setSummarizeText(e.target.value)}
                      placeholder="Paste your academic text, lecture notes, or study material here..."
                      className="min-h-32 resize-none border-2 border-dashed border-purple-200 focus:border-purple-500 transition-colors"
                    />
                    
                    <Button 
                      onClick={handleSummarize}
                      disabled={isSummarizing || !summarizeText.trim()}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200"
                      size="lg"
                    >
                      <Brain className="h-5 w-5 mr-2" />
                      {isSummarizing ? "Generating Summary..." : "Generate Smart Summary"}
                    </Button>

                    {summary && (
                      <Card className="bg-purple-50 border-purple-200 animate-fade-in">
                        <CardContent className="p-6">
                          <h4 className="font-medium text-purple-800 mb-3">📚 Academic Summary</h4>
                          <div className="bg-white p-4 rounded-lg border border-purple-200">
                            <p className="text-gray-800">{summary}</p>
                          </div>
                          <Button
                            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                            onClick={() => {
                              setSummary("");
                              setSummarizeText("");
                            }}
                          >
                            Summarize Another Text
                          </Button>
                        </CardContent>
                      </Card>
                    )}
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
              <h3 className="font-semibold text-lg mb-2">Multi-Modal Input</h3>
              <p className="text-gray-600">Text, images, voice, and documents - all supported</p>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Intelligent Processing</h3>
              <p className="text-gray-600">Advanced AI with learning analytics and topic detection</p>
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: "600ms" }}>
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Languages className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Accessible Learning</h3>
              <p className="text-gray-600">Multi-language support with voice input/output</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
