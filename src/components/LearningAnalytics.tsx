
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, BookOpen, TrendingUp, Target, Lightbulb } from "lucide-react";
import { AIService } from "@/services/aiService";

const LearningAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalQuestions: 0,
    topicsStudied: 0,
    weakAreas: [],
    recommendations: []
  });

  useEffect(() => {
    const updateAnalytics = () => {
      const stats = AIService.getStudyAnalytics();
      setAnalytics(stats);
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getProgressLevel = () => {
    if (analytics.totalQuestions < 5) return { level: 'Beginner', progress: 20 };
    if (analytics.totalQuestions < 15) return { level: 'Learning', progress: 50 };
    if (analytics.totalQuestions < 30) return { level: 'Progressing', progress: 75 };
    return { level: 'Advanced', progress: 100 };
  };

  const { level, progress } = getProgressLevel();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold mb-2">Learning Analytics</h3>
        <p className="text-gray-600">Track your study progress and get personalized insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Questions Asked</p>
                <p className="text-2xl font-bold text-blue-800">{analytics.totalQuestions}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Topics Explored</p>
                <p className="text-2xl font-bold text-green-800">{analytics.topicsStudied}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <TrendingUp className="h-5 w-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-700">Level: {level}</span>
              <Badge variant="secondary" className="bg-purple-200 text-purple-800">
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-purple-600">
              Keep asking questions to advance to the next level!
            </p>
          </div>
        </CardContent>
      </Card>

      {analytics.weakAreas.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Target className="h-5 w-5" />
              Areas to Focus On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.weakAreas.map((area, index) => (
                <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.recommendations.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Lightbulb className="h-5 w-5" />
              Study Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-yellow-800">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LearningAnalytics;
