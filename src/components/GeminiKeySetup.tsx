
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { GeminiService } from "@/services/geminiService";

interface GeminiKeySetupProps {
  onApiKeySet: (hasKey: boolean) => void;
}

const GeminiKeySetup = ({ onApiKeySet }: GeminiKeySetupProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSet, setIsSet] = useState(GeminiService.hasApiKey());

  const handleSetApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid Gemini API key",
        variant: "destructive"
      });
      return;
    }

    GeminiService.setApiKey(apiKey);
    setIsSet(true);
    onApiKeySet(true);
    
    toast({
      title: "Gemini API Key Set!",
      description: "Advanced AI features are now available",
    });
  };

  const handleClearApiKey = () => {
    GeminiService.clearApiKey();
    setApiKey('');
    setIsSet(false);
    onApiKeySet(false);
    
    toast({
      title: "API Key Cleared",
      description: "Switched back to basic chatbot mode",
    });
  };

  if (isSet) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Gemini AI Configured</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Enhanced Mode
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearApiKey}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear Key
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5 text-blue-600" />
          Gemini AI Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Enhanced AI Features</p>
            <p>Enter your Gemini API key to unlock advanced AI tutoring capabilities for all subjects.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <Button 
            onClick={handleSetApiKey} 
            disabled={!apiKey.trim()}
            className="w-full"
          >
            <Key className="h-4 w-4 mr-2" />
            Set Gemini API Key
          </Button>
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p>• Your API key is stored locally and secure</p>
          <p>• Get your free API key from: <span className="font-mono">aistudio.google.com</span></p>
          <p>• Enables advanced tutoring for all academic subjects</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeminiKeySetup;
