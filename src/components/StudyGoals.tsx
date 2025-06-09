
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Target, Plus } from "lucide-react";
import { ClusteringService } from "@/services/clusteringService";
import { toast } from "@/hooks/use-toast";

interface StudyGoal {
  id: string;
  type: 'daily_questions' | 'weekly_topics' | 'monthly_sessions';
  target: number;
  current: number;
  deadline: Date;
}

interface StudyGoalsProps {
  goals: StudyGoal[];
  onGoalsUpdate: () => void;
}

const StudyGoals = ({ goals, onGoalsUpdate }: StudyGoalsProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'daily_questions' as const,
    target: 10,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
  });

  const goalTypeLabels = {
    daily_questions: 'Daily Questions',
    weekly_topics: 'Weekly Topics',
    monthly_sessions: 'Monthly Sessions'
  };

  const handleAddGoal = () => {
    ClusteringService.addGoal({
      type: newGoal.type,
      target: newGoal.target,
      deadline: newGoal.deadline
    });
    
    setShowAddForm(false);
    setNewGoal({
      type: 'daily_questions',
      target: 10,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    onGoalsUpdate();
    
    toast({
      title: "Goal Added!",
      description: "Your study goal has been set successfully.",
    });
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-green-800">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Study Goals
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
            <h4 className="font-medium mb-3 text-green-800">Add New Goal</h4>
            <div className="space-y-3">
              <Select
                value={newGoal.type}
                onValueChange={(value: any) => setNewGoal({ ...newGoal, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_questions">Daily Questions</SelectItem>
                  <SelectItem value="weekly_topics">Weekly Topics</SelectItem>
                  <SelectItem value="monthly_sessions">Monthly Sessions</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Target number"
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
              />
              
              <div className="flex gap-2">
                <Button onClick={handleAddGoal} className="bg-green-600 hover:bg-green-700">
                  Add Goal
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-green-600 text-center py-4">
              No goals set yet. Add your first study goal to track your progress!
            </p>
          ) : (
            goals.map((goal) => {
              const progress = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;
              const isCompleted = goal.current >= goal.target;
              
              return (
                <div key={goal.id} className="p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-green-800">
                      {goalTypeLabels[goal.type]}
                    </h4>
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <Progress value={progress} className="mb-2" />
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>{Math.round(progress)}% complete</span>
                    {isCompleted && (
                      <span className="text-green-600 font-medium">🎉 Completed!</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyGoals;
