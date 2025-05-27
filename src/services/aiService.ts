
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
    console.log('Generating response for:', message);
    
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

    // Enhanced basic response system
    try {
      const topic = await this.detectTopic(message);
      ClusteringService.addQuestion(message, topic);

      // Handle greetings and basic interactions
      if (this.isGreeting(message)) {
        return this.getGreetingResponse();
      }

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

      // Smart responses based on topic detection and message analysis
      return this.getTopicBasedResponse(message, topic);
      
    } catch (error) {
      console.error('Response generation error:', error);
      return this.getFallbackResponse();
    }
  }

  private static isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you'];
    const lowerMessage = message.toLowerCase().trim();
    return greetings.some(greeting => lowerMessage.includes(greeting)) || lowerMessage.length < 10;
  }

  private static getGreetingResponse(): string {
    const greetings = [
      "Hello! I'm EduBot, your AI academic companion. How can I help you with your studies today?",
      "Hi there! I'm here to assist you with learning. You can ask me questions, upload images for text extraction, or request summaries!",
      "Hey! Welcome to EduBot. I can help you understand academic content, answer questions, and summarize materials. What would you like to explore?",
      "Good to see you! I'm your AI study assistant. Feel free to ask questions, share study materials, or request explanations on any topic."
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private static getTopicBasedResponse(message: string, topic: string): string {
    const topicResponses: Record<string, string[]> = {
      mathematics: [
        "I can help you with math problems! Share your mathematical content and I'll explain the concepts step by step.",
        "Mathematics is fascinating! Upload an image of equations or paste mathematical content for detailed explanations.",
        "I'm ready to tackle math questions with you. What mathematical concept would you like to explore?"
      ],
      physics: [
        "Physics concepts can be complex! Share your physics content and I'll help break down the principles.",
        "I love physics questions! Upload diagrams or text about the physics topic you're studying.",
        "Physics is all about understanding how the world works. What physics concept can I help explain?"
      ],
      chemistry: [
        "Chemistry requires understanding reactions and molecular interactions. Share your content for detailed explanations!",
        "Chemical concepts made simple! Upload your chemistry notes or questions and I'll help clarify.",
        "Chemistry is the science of matter and change. What chemical concept would you like to explore?"
      ],
      biology: [
        "Biology is the study of life! Share your biological content and I'll help explain the processes.",
        "I can help with biological concepts, from cells to ecosystems. What would you like to learn about?",
        "Life sciences are fascinating! Upload your biology materials for detailed explanations."
      ],
      history: [
        "History helps us understand the past! Share historical content and I'll provide context and explanations.",
        "I can help analyze historical events and their significance. What period or event interests you?",
        "Historical understanding is key to learning. Share your history materials for detailed analysis."
      ],
      literature: [
        "Literature analysis is my specialty! Share texts and I'll help with themes, characters, and meanings.",
        "I can help analyze literary works, poetry, and prose. What piece of literature are you studying?",
        "Literature opens windows to different worlds. Share your reading materials for detailed analysis."
      ],
      'computer science': [
        "Programming and computer science concepts are exciting! Share your code or CS content for explanations.",
        "I can help with algorithms, data structures, and programming concepts. What CS topic interests you?",
        "Technology shapes our world! Share your computer science materials for detailed explanations."
      ],
      general: [
        "I'm here to help with your studies! You can upload images, ask questions, or request summaries on any academic topic.",
        "Feel free to share any academic content - I can analyze images, summarize text, and answer questions across all subjects.",
        "I'm your comprehensive study assistant! Upload study materials, ask questions, or request explanations on any topic.",
        "Ready to learn together! Share your academic content and I'll provide detailed explanations and answers."
      ]
    };

    const responses = topicResponses[topic] || topicResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static getFallbackResponse(): string {
    return "I'm here to help you learn! Try asking me a specific question, uploading study materials, or requesting a summary. I can assist with various academic subjects including math, science, history, and more.";
  }

  static getStudyAnalytics() {
    return ClusteringService.getStudyStats();
  }
}
