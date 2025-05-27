
export class ClusteringService {
  private static questionHistory: { question: string; topic: string; timestamp: Date }[] = [];
  private static weakAreas: Map<string, number> = new Map();

  static addQuestion(question: string, topic: string = 'general') {
    this.questionHistory.push({
      question,
      topic,
      timestamp: new Date()
    });

    // Track potential weak areas
    const topicCount = this.weakAreas.get(topic) || 0;
    this.weakAreas.set(topic, topicCount + 1);
  }

  static getFrequentTopics(): { topic: string; count: number }[] {
    const topics = Array.from(this.weakAreas.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
    
    return topics.slice(0, 5); // Top 5 topics
  }

  static getWeakAreas(): string[] {
    const frequent = this.getFrequentTopics();
    return frequent
      .filter(item => item.count >= 3) // Topics asked 3+ times might be weak areas
      .map(item => item.topic);
  }

  static getRecommendations(): string[] {
    const weakAreas = this.getWeakAreas();
    const recommendations = [
      "Consider reviewing fundamental concepts",
      "Practice more problems in your weak areas",
      "Try visual learning methods for better understanding",
      "Break down complex topics into smaller parts"
    ];

    if (weakAreas.length > 0) {
      recommendations.unshift(`Focus on: ${weakAreas.join(', ')}`);
    }

    return recommendations;
  }

  static getStudyStats(): {
    totalQuestions: number;
    topicsStudied: number;
    weakAreas: string[];
    recommendations: string[];
  } {
    return {
      totalQuestions: this.questionHistory.length,
      topicsStudied: this.weakAreas.size,
      weakAreas: this.getWeakAreas(),
      recommendations: this.getRecommendations()
    };
  }
}
