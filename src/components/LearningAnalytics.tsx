
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, BookOpen, TrendingUp, Target, Lightbulb, Download, MessageSquare, Star, Clock, BarChart3 } from "lucide-react";
import { ClusteringService } from "@/services/clusteringService";
import { toast } from "@/hooks/use-toast";
import PerformanceChart from "./PerformanceChart";
import AchievementsBadges from "./AchievementsBadges";
import StudyGoals from "./StudyGoals";

const LearningAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalQuestions: 0,
    topicsStudied: 0,
    weakAreas: [],
    recommendations: [],
    sessionDuration: 0,
    dailyActivity: [],
    moduleUsage: [],
    achievements: [],
    goals: [],
    conceptMastery: []
  });
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sessionRating, setSessionRating] = useState(0);

  useEffect(() => {
    const updateAnalytics = () => {
      const stats = ClusteringService.getStudyStats();
      setAnalytics(stats);
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 2000); // Update every 2 seconds for real-time feel

    return () => clearInterval(interval);
  }, []);

  const getProgressLevel = () => {
    if (analytics.totalQuestions < 5) return { level: 'Beginner', progress: 20, color: 'bg-blue-500' };
    if (analytics.totalQuestions < 15) return { level: 'Learning', progress: 50, color: 'bg-green-500' };
    if (analytics.totalQuestions < 30) return { level: 'Progressing', progress: 75, color: 'bg-orange-500' };
    return { level: 'Advanced', progress: 100, color: 'bg-purple-500' };
  };

  const { level, progress, color } = getProgressLevel();

  const handleExportData = () => {
    const exportData = ClusteringService.exportData();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edubot-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported!",
      description: "Your learning analytics have been downloaded.",
    });
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim() || sessionRating > 0) {
      // In a real app, this would be sent to a backend
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. It helps us improve EduBot.",
      });
      setFeedback("");
      setSessionRating(0);
      setShowFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-2xl font-bold mb-2 text-gray-800">Learning Analytics Dashboard</h3>
        <p className="text-gray-600 font-medium">Track your study progress and get personalized insights</p>
      </div>

      {/* Performance Charts */}
      <PerformanceChart 
        dailyActivity={analytics.dailyActivity}
        moduleUsage={analytics.moduleUsage}
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-bold">Questions Asked</p>
                <p className="text-3xl font-bold text-blue-800 group-hover:scale-110 transition-transform">
                  {analytics.totalQuestions}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600 group-hover:rotate-12 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-bold">Topics Explored</p>
                <p className="text-3xl font-bold text-green-800 group-hover:scale-110 transition-transform">
                  {analytics.topicsStudied}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600 group-hover:rotate-12 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-bold">Session Time</p>
                <p className="text-3xl font-bold text-orange-800 group-hover:scale-110 transition-transform">
                  {analytics.sessionDuration}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 group-hover:rotate-12 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-bold">Achievements</p>
                <p className="text-3xl font-bold text-purple-800 group-hover:scale-110 transition-transform">
                  {analytics.achievements.filter(a => a.unlocked).length}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-600 group-hover:rotate-12 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 text-xl font-bold">
            <TrendingUp className="h-6 w-6" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-purple-700">Level: {level}</span>
              <Badge variant="secondary" className={`${color} text-white text-lg px-3 py-1`}>
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-purple-600 font-medium">
              Keep asking questions to advance to the next level! 🚀
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Concept Mastery */}
      {analytics.conceptMastery.length > 0 && (
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-800 text-xl font-bold">
              <BarChart3 className="h-6 w-6" />
              Concept Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.conceptMastery.map((concept, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-teal-200">
                  <span className="font-medium text-teal-800 capitalize">{concept.topic}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={concept.level} className="w-20" />
                    <span className="text-sm font-bold text-teal-600">{concept.level}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Goals */}
      <StudyGoals 
        goals={analytics.goals} 
        onGoalsUpdate={() => {
          const stats = ClusteringService.getStudyStats();
          setAnalytics(stats);
        }}
      />

      {/* Achievements */}
      <AchievementsBadges achievements={analytics.achievements} />

      {/* Focus Areas */}
      {analytics.weakAreas.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 text-xl font-bold">
              <Target className="h-6 w-6" />
              Areas to Focus On
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.weakAreas.map((area, index) => (
                <Badge key={index} variant="outline" className="border-orange-300 text-orange-700 text-sm font-medium px-3 py-1">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 text-xl font-bold">
              <Lightbulb className="h-6 w-6" />
              Study Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analytics.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3 p-2 bg-white rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-sm text-yellow-800 font-medium">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions and Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Download your complete learning analytics data</p>
            <Button onClick={handleExportData} className="w-full bg-gray-600 hover:bg-gray-700">
              <Download className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <MessageSquare className="h-5 w-5" />
              Session Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-600 mb-4">Help us improve your learning experience</p>
            {!showFeedback ? (
              <Button 
                onClick={() => setShowFeedback(true)} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Give Feedback
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-indigo-800 mb-2 block">
                    Rate this session:
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSessionRating(star)}
                        className={`text-2xl ${
                          star <= sessionRating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Share your thoughts about this learning session..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-16"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmitFeedback} className="bg-indigo-600 hover:bg-indigo-700">
                    Submit
                  </Button>
                  <Button variant="outline" onClick={() => setShowFeedback(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningAnalytics;
