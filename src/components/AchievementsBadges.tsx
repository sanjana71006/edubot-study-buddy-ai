
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface AchievementsBadgesProps {
  achievements: Achievement[];
}

const AchievementsBadges = ({ achievements }: AchievementsBadgesProps) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <Trophy className="h-5 w-5" />
          Achievements ({unlockedCount}/{totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border transition-all duration-300 text-center ${
                achievement.unlocked
                  ? "bg-white border-yellow-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  : "bg-gray-100 border-gray-300 opacity-60"
              }`}
            >
              <div className="text-2xl mb-2">
                {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6 mx-auto text-gray-400" />}
              </div>
              <h4 className={`font-medium text-sm mb-1 ${
                achievement.unlocked ? "text-yellow-800" : "text-gray-500"
              }`}>
                {achievement.title}
              </h4>
              <p className={`text-xs ${
                achievement.unlocked ? "text-yellow-600" : "text-gray-400"
              }`}>
                {achievement.description}
              </p>
              {achievement.unlocked && achievement.unlockedAt && (
                <Badge variant="secondary" className="mt-2 text-xs bg-yellow-200 text-yellow-800">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsBadges;
