
import { pipeline } from '@huggingface/transformers';
import { ClusteringService } from './clusteringService';
import { ChatbotService } from './chatbotService';

export class AIService {
  private static summarizer: any = null;
  private static qaModel: any = null;
  private static classifier: any = null;
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('Initializing AI models...');
      
      // Initialize summarization model
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6', {
        device: 'webgpu',
        dtype: 'fp32'
      });
      
      // Initialize Q&A model
      this.qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad', {
        device: 'webgpu',
        dtype: 'fp32'
      });

      // Initialize text classification for topic detection
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli', {
        device: 'webgpu',
        dtype: 'fp32'
      });
      
      this.initialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU');
      
      // Fallback to CPU
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
      this.qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
      this.classifier = await pipeline('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli');
      
      this.initialized = true;
    }
  }

  static async detectTopic(text: string): Promise<string> {
    await this.initialize();
    
    const academicTopics = [
      'mathematics', 'physics', 'chemistry', 'biology', 'history', 
      'literature', 'computer science', 'engineering', 'economics', 'general'
    ];

    try {
      const result = await this.classifier(text, academicTopics);
      return result.labels[0];
    } catch (error) {
      console.error('Topic detection error:', error);
      return 'general';
    }
  }

  static async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    await this.initialize();
    
    if (text.length < 100) {
      return "Text is too short to summarize effectively. Please provide more content for a meaningful summary.";
    }
    
    try {
      const result = await this.summarizer(text, {
        max_length: maxLength,
        min_length: 50,
        do_sample: false
      });
      
      return result[0].summary_text;
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to summarize text');
    }
  }

  static async answerQuestion(context: string, question: string): Promise<{ answer: string; confidence: number; topic: string }> {
    await this.initialize();
    
    if (!context || !question) {
      throw new Error('Both context and question are required');
    }
    
    try {
      const result = await this.qaModel(question, context);
      const topic = await this.detectTopic(question);
      
      // Track the question for learning analytics
      ClusteringService.addQuestion(question, topic);
      
      return {
        answer: result.answer,
        confidence: Math.round(result.score * 100),
        topic
      };
    } catch (error) {
      console.error('Q&A error:', error);
      throw new Error('Failed to answer question');
    }
  }

  static async generateResponse(message: string, context?: string): Promise<string> {
    // Check if enhanced chatbot is available
    if (ChatbotService.hasApiKey()) {
      try {
        let enhancedPrompt = message;
        if (context) {
          enhancedPrompt = `Based on this content: "${context.substring(0, 500)}...", please answer: ${message}`;
        }
        return await ChatbotService.sendMessage(enhancedPrompt);
      } catch (error) {
        console.error('Enhanced chatbot error, falling back to basic mode:', error);
        // Fall through to basic response generation
      }
    }

    const topic = await this.detectTopic(message);
    ClusteringService.addQuestion(message, topic);

    // Enhanced response generation based on context
    if (context) {
      if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary')) {
        const summary = await this.summarizeText(context);
        return `📚 **Summary**: ${summary}`;
      }
      
      if (message.includes('?')) {
        const result = await this.answerQuestion(context, message);
        return `💡 **Answer**: ${result.answer}\n\n🎯 **Confidence**: ${result.confidence}%\n📖 **Topic**: ${result.topic}`;
      }

      if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what is')) {
        const result = await this.answerQuestion(context, message);
        return `🔍 **Explanation**: ${result.answer}\n\n📊 **Confidence**: ${result.confidence}%`;
      }
    }

    // Smart responses based on topic detection
    const topicResponses: Record<string, string[]> = {
      mathematics: [
        "I can help you with math problems! Upload an image of equations or paste mathematical content.",
        "Great! Mathematics is one of my strong areas. Share your problem and I'll walk you through it.",
      ],
      physics: [
        "Physics concepts can be tricky! Share your physics content and I'll help explain the concepts.",
        "I love physics questions! Upload diagrams or text about the topic you're studying.",
      ],
      chemistry: [
        "Chemistry requires understanding reactions and formulas. Share your content for detailed explanations!",
        "Chemical concepts made simple! Upload your chemistry notes or questions.",
      ],
      general: [
        "I'm here to help with your studies! You can upload images, ask questions, or request summaries.",
        "Feel free to share any academic content - I can analyze images, summarize text, and answer questions.",
        "Upload study materials or ask me questions about any subject. I'm designed to make learning easier!",
      ]
    };

    const responses = topicResponses[topic] || topicResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  static getStudyAnalytics() {
    return ClusteringService.getStudyStats();
  }
}
