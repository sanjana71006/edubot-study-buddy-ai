
export interface UserInteraction {
  id: string;
  type: 'chat' | 'voice' | 'ocr' | 'summary' | 'analytics';
  question: string;
  response?: string;
  topic: string;
  timestamp: Date;
  duration?: number;
  moduleUsed: string;
}

export interface StudyGoal {
  id: string;
  type: 'daily_questions' | 'weekly_topics' | 'monthly_sessions';
  target: number;
  current: number;
  deadline: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  requirement: {
    type: string;
    count: number;
  };
}

export class ClusteringService {
  private static interactions: UserInteraction[] = [];
  private static topicFrequency: Map<string, number> = new Map();
  private static moduleUsage: Map<string, number> = new Map();
  private static sessionStartTime: Date = new Date();
  private static dailyActivity: Map<string, number> = new Map();
  private static goals: StudyGoal[] = [];
  private static achievements: Achievement[] = [
    {
      id: 'first_question',
      title: 'First Steps',
      description: 'Asked your first question',
      icon: '🎯',
      unlocked: false,
      requirement: { type: 'questions', count: 1 }
    },
    {
      id: 'curious_learner',
      title: 'Curious Learner',
      description: 'Asked 10 questions',
      icon: '🤔',
      unlocked: false,
      requirement: { type: 'questions', count: 10 }
    },
    {
      id: 'topic_explorer',
      title: 'Topic Explorer',
      description: 'Explored 5 different topics',
      icon: '🗺️',
      unlocked: false,
      requirement: { type: 'topics', count: 5 }
    },
    {
      id: 'voice_pioneer',
      title: 'Voice Pioneer',
      description: 'Used voice assistant 5 times',
      icon: '🎤',
      unlocked: false,
      requirement: { type: 'voice_interactions', count: 5 }
    },
    {
      id: 'summary_master',
      title: 'Summary Master',
      description: 'Generated 3 summaries',
      icon: '📄',
      unlocked: false,
      requirement: { type: 'summaries', count: 3 }
    }
  ];

  static addInteraction(
    type: UserInteraction['type'],
    question: string,
    topic: string = 'general',
    response?: string,
    duration?: number
  ): void {
    const interaction: UserInteraction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      question,
      response,
      topic,
      timestamp: new Date(),
      duration,
      moduleUsed: this.getModuleName(type)
    };

    this.interactions.push(interaction);
    
    // Update topic frequency
    const currentCount = this.topicFrequency.get(topic) || 0;
    this.topicFrequency.set(topic, currentCount + 1);
    
    // Update module usage
    const moduleCount = this.moduleUsage.get(type) || 0;
    this.moduleUsage.set(type, moduleCount + 1);
    
    // Update daily activity
    const today = new Date().toDateString();
    const todayCount = this.dailyActivity.get(today) || 0;
    this.dailyActivity.set(today, todayCount + 1);
    
    // Check for achievements
    this.checkAchievements();
  }

  private static getModuleName(type: UserInteraction['type']): string {
    const moduleNames = {
      chat: 'AI Chat Assistant',
      voice: 'Voice Assistant',
      ocr: 'Image to Text',
      summary: 'Smart Summary & Q&A',
      analytics: 'Learning Analytics'
    };
    return moduleNames[type] || 'Unknown';
  }

  private static checkAchievements(): void {
    this.achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        let currentCount = 0;
        
        switch (achievement.requirement.type) {
          case 'questions':
            currentCount = this.interactions.length;
            break;
          case 'topics':
            currentCount = this.topicFrequency.size;
            break;
          case 'voice_interactions':
            currentCount = this.interactions.filter(i => i.type === 'voice').length;
            break;
          case 'summaries':
            currentCount = this.interactions.filter(i => i.type === 'summary').length;
            break;
        }
        
        if (currentCount >= achievement.requirement.count) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
        }
      }
    });
  }

  static getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  static getInteractionsByType(type: UserInteraction['type']): UserInteraction[] {
    return this.interactions.filter(interaction => interaction.type === type);
  }

  static getFrequentTopics(): { topic: string; count: number }[] {
    const topics = Array.from(this.topicFrequency.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
    
    return topics.slice(0, 10);
  }

  static getWeakAreas(): string[] {
    const frequent = this.getFrequentTopics();
    return frequent
      .filter(item => item.count >= 3)
      .map(item => item.topic);
  }

  static getRecommendations(): string[] {
    const weakAreas = this.getWeakAreas();
    const recentTopics = this.interactions
      .slice(-5)
      .map(i => i.topic)
      .filter((topic, index, self) => self.indexOf(topic) === index);

    const recommendations = [
      "Consider reviewing fundamental concepts",
      "Practice more problems in your weak areas",
      "Try visual learning methods for better understanding",
      "Break down complex topics into smaller parts"
    ];

    if (weakAreas.length > 0) {
      recommendations.unshift(`Focus on: ${weakAreas.join(', ')}`);
    }
    
    if (recentTopics.length > 0) {
      recommendations.push(`Recent topics to revisit: ${recentTopics.join(', ')}`);
    }

    return recommendations;
  }

  static getDailyActivity(): { date: string; count: number }[] {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      const count = this.dailyActivity.get(dateString) || 0;
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count
      });
    }
    return last7Days;
  }

  static getModuleUsage(): { module: string; count: number; percentage: number }[] {
    const totalInteractions = this.interactions.length;
    return Array.from(this.moduleUsage.entries()).map(([type, count]) => ({
      module: this.getModuleName(type as UserInteraction['type']),
      count,
      percentage: totalInteractions > 0 ? Math.round((count / totalInteractions) * 100) : 0
    }));
  }

  static getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  static getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  static addGoal(goal: Omit<StudyGoal, 'id' | 'current'>): void {
    const newGoal: StudyGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      current: 0
    };
    this.goals.push(newGoal);
  }

  static updateGoalProgress(): void {
    const today = new Date().toDateString();
    const todayCount = this.dailyActivity.get(today) || 0;
    
    this.goals.forEach(goal => {
      if (goal.type === 'daily_questions') {
        goal.current = todayCount;
      }
    });
  }

  static getGoals(): StudyGoal[] {
    this.updateGoalProgress();
    return [...this.goals];
  }

  static getStudyStats(): {
    totalQuestions: number;
    topicsStudied: number;
    weakAreas: string[];
    recommendations: string[];
    sessionDuration: number;
    dailyActivity: { date: string; count: number }[];
    moduleUsage: { module: string; count: number; percentage: number }[];
    achievements: Achievement[];
    goals: StudyGoal[];
    conceptMastery: { topic: string; level: number }[];
  } {
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime.getTime()) / (1000 * 60));
    
    // Calculate concept mastery
    const conceptMastery = this.getFrequentTopics().slice(0, 5).map(topic => ({
      topic: topic.topic,
      level: Math.min(Math.round((topic.count / 10) * 100), 100)
    }));

    return {
      totalQuestions: this.interactions.length,
      topicsStudied: this.topicFrequency.size,
      weakAreas: this.getWeakAreas(),
      recommendations: this.getRecommendations(),
      sessionDuration,
      dailyActivity: this.getDailyActivity(),
      moduleUsage: this.getModuleUsage(),
      achievements: this.getAchievements(),
      goals: this.getGoals(),
      conceptMastery
    };
  }

  static clearData(): void {
    this.interactions = [];
    this.topicFrequency.clear();
    this.moduleUsage.clear();
    this.dailyActivity.clear();
    this.sessionStartTime = new Date();
    this.goals = [];
    this.achievements.forEach(achievement => {
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
    });
  }

  static exportData(): string {
    return JSON.stringify({
      interactions: this.interactions,
      topicFrequency: Array.from(this.topicFrequency.entries()),
      moduleUsage: Array.from(this.moduleUsage.entries()),
      dailyActivity: Array.from(this.dailyActivity.entries()),
      goals: this.goals,
      achievements: this.achievements,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}
