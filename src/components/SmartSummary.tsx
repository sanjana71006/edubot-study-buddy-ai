
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, MessageCircle, Volume2, Copy, Languages } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AIService } from "@/services/aiService";
import { VoiceService } from "@/services/voiceService";
import { TranslationService } from "@/services/translationService";

interface SmartSummaryProps {
  extractedText?: string;
}

const SmartSummary = ({ extractedText }: SmartSummaryProps) => {
  const [inputText, setInputText] = useState(extractedText || "");
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [topic, setTopic] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No Text",
        description: "Please enter some text to summarize",
        variant: "destructive"
      });
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await AIService.processImageAndSummarize(inputText);
      setSummary(result.summary);
      setTopic(result.topic);
      
      // Auto-speak the summary
      await VoiceService.speakResponse(result.summary);
      
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

  const handleAskQuestion = async () => {
    if (!summary || !question.trim()) {
      toast({
        title: "Missing Requirements",
        description: "Please generate a summary first and ask a question",
        variant: "destructive"
      });
      return;
    }

    setIsAnswering(true);
    try {
      const result = await AIService.answerQuestion(summary, question);
      const formattedAnswer = `${result.answer} (Confidence: ${result.confidence}%)`;
      setAnswer(formattedAnswer);
      
      // Auto-speak the answer
      await VoiceService.speakResponse(result.answer);
      
      toast({
        title: "Question Answered!",
        description: "Based on the summarized content",
      });
    } catch (error) {
      console.error('Q&A error:', error);
      toast({
        title: "Failed to Answer",
        description: "Could not answer the question. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnswering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const speakText = async (text: string) => {
    try {
      await VoiceService.speakResponse(text);
    } catch (error) {
      toast({
        title: "Voice Error",
        description: "Could not speak the text",
        variant: "destructive"
      });
    }
  };

  const translateText = async (text: string) => {
    if (!selectedLanguage) {
      toast({
        title: "No Language Selected",
        description: "Please select a target language for translation",
        variant: "destructive"
      });
      return;
    }

    try {
      const translated = await TranslationService.translateText(text, selectedLanguage);
      toast({
        title: "Translation Complete",
        description: `Translated to ${TranslationService.getSupportedLanguages()[selectedLanguage]}`,
      });
      
      // Show translation in a card or modal
      setAnswer(`Translation (${TranslationService.getSupportedLanguages()[selectedLanguage]}): ${translated}`);
      await VoiceService.speakResponse(translated, selectedLanguage === 'hi' ? 'hi-IN' : 'en-US');
    } catch (error) {
      toast({
        title: "Translation Failed",
        description: "Could not translate the text",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold mb-2">Smart Summary & Q&A Assistant</h3>
        <p className="text-gray-600">Generate intelligent summaries and ask questions about your content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Input Text for Summarization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your academic content, lecture notes, or study material here..."
            className="min-h-32 resize-none border-2 border-dashed border-purple-200 focus:border-purple-500 transition-colors"
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSummarize}
              disabled={isSummarizing || !inputText.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isSummarizing ? "Summarizing..." : "Generate Smart Summary"}
            </Button>
            
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Select Language</option>
              {Object.entries(TranslationService.getSupportedLanguages()).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card className="bg-purple-50 border-purple-200 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Summary
              </div>
              <div className="flex gap-2">
                {topic && <Badge variant="secondary">{topic}</Badge>}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(summary)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => speakText(summary)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => translateText(summary)}
                  disabled={!selectedLanguage}
                >
                  <Languages className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <p className="text-gray-800">{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ask Questions About the Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the summarized content..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <Button
                onClick={handleAskQuestion}
                disabled={isAnswering || !question.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isAnswering ? "Thinking..." : "Ask"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {answer && (
        <Card className="bg-blue-50 border-blue-200 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Answer
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(answer)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => speakText(answer)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => translateText(answer)}
                  disabled={!selectedLanguage}
                >
                  <Languages className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <p className="text-gray-800">{answer}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartSummary;
