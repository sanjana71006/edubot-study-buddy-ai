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
    
    // Enhanced response generation with better pattern matching
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if enhanced chatbot is available
    if (ChatbotService.hasApiKey()) {
      try {
        let enhancedPrompt = message;
        if (context) {
          enhancedPrompt = `Context: ${context.substring(0, 500)}\n\nUser Question: ${message}\n\nPlease provide a comprehensive, educational answer based on the context provided.`;
        }
        return await ChatbotService.sendMessage(enhancedPrompt);
      } catch (error) {
        console.error('Enhanced chatbot error, falling back to local processing:', error);
      }
    }

    // Enhanced local response generation
    try {
      const topic = await this.detectTopic(message);
      ClusteringService.addQuestion(message, topic);

      // Handle specific question types with improved responses
      if (this.isGreeting(message)) {
        return this.getGreetingResponse();
      }

      if (this.isColorQuestion(message)) {
        return this.getColorResponse();
      }

      if (this.isListRequest(message)) {
        return this.generateListResponse(message);
      }

      if (context) {
        if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
          const summary = await this.summarizeText(context);
          return `📚 **Summary**:\n\n${summary}\n\nWould you like me to explain any specific part in more detail?`;
        }
        
        if (message.includes('?')) {
          const result = await this.answerQuestion(context, message);
          return `💡 **Answer**: ${result.answer}\n\n🎯 **Confidence**: ${result.confidence}%\n📖 **Topic**: ${result.topic}\n\nDo you have any follow-up questions?`;
        }

        if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
          const result = await this.answerQuestion(context, message);
          return `🔍 **Explanation**: ${result.answer}\n\n📊 **Confidence**: ${result.confidence}%\n\nFeel free to ask for clarification on any part!`;
        }
      }

      // Generate contextual responses based on message analysis
      return this.getEnhancedTopicResponse(message, topic, context);
      
    } catch (error) {
      console.error('Response generation error:', error);
      return this.getIntelligentFallbackResponse(message);
    }
  }

  private static isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'greetings'];
    const lowerMessage = message.toLowerCase().trim();
    return greetings.some(greeting => lowerMessage.includes(greeting)) || lowerMessage.length < 10;
  }

  private static isColorQuestion(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes('color') && (lowerMessage.includes('name') || lowerMessage.includes('list') || lowerMessage.includes('give me'));
  }

  private static isListRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return (lowerMessage.includes('give me') || lowerMessage.includes('list') || lowerMessage.includes('name')) && 
           (lowerMessage.includes('5') || lowerMessage.includes('five') || lowerMessage.includes('10') || lowerMessage.includes('ten'));
  }

  private static getColorResponse(): string {
    return `🎨 **Here are 5 beautiful colors:**

1. **Red** - The color of passion, roses, and fire 🔴
2. **Blue** - The color of the sky, ocean, and tranquility 🔵
3. **Green** - The color of nature, grass, and growth 🟢
4. **Yellow** - The color of sunshine, happiness, and energy 🟡
5. **Purple** - The color of royalty, creativity, and mystery 🟣

Each color has unique psychological effects and cultural meanings. Would you like to learn more about color psychology or how colors are used in different fields?`;
  }

  private static generateListResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('planet')) {
      return `🌍 **Here are the 8 planets in our solar system:**

1. **Mercury** - Closest to the Sun, very hot
2. **Venus** - Hottest planet, thick atmosphere
3. **Earth** - Our home planet with life
4. **Mars** - The red planet
5. **Jupiter** - Largest planet, gas giant
6. **Saturn** - Famous for its rings
7. **Uranus** - Tilted on its side
8. **Neptune** - Furthest from the Sun, very cold

Would you like to learn more about any specific planet?`;
    }

    if (lowerMessage.includes('animal')) {
      return `🐾 **Here are 5 amazing animals:**

1. **Lion** - King of the jungle, powerful predator
2. **Elephant** - Largest land mammal, very intelligent
3. **Dolphin** - Highly intelligent marine mammal
4. **Eagle** - Majestic bird of prey with excellent vision
5. **Tiger** - Beautiful striped big cat, excellent hunter

Each animal has unique adaptations and behaviors. Which one would you like to learn more about?`;
    }

    return `I'd be happy to create a list for you! Could you be more specific about what type of list you're looking for? For example:
- Colors, animals, countries, subjects, etc.
- Historical events, scientific concepts, etc.

Just let me know the topic and I'll provide a detailed list!`;
  }

  private static getGreetingResponse(): string {
    const greetings = [
      "Hello! I'm EduBot, your intelligent AI study companion! 🤖✨ I can help you with:\n\n📚 Answering questions on any topic\n🖼️ Extracting text from images\n📝 Creating summaries\n🌐 Translating content\n🗣️ Voice interactions\n\nWhat would you like to explore today?",
      "Hi there! Welcome to your AI-powered learning experience! 🎓 I'm here to assist with:\n\n❓ Answering your questions\n📄 Processing documents and images\n🧠 Explaining complex concepts\n🌍 Multi-language support\n\nHow can I help you learn something new today?",
      "Hey! Great to see you! I'm your dedicated AI tutor ready to help with all your learning needs! 📖💡 I can:\n\n🔍 Research and explain topics\n📊 Summarize content\n🎯 Answer specific questions\n🗣️ Communicate via voice\n\nWhat subject or topic interests you today?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private static getEnhancedTopicResponse(message: string, topic: string, context?: string): string {
    const contextNote = context ? "\n\n💡 I can provide more specific answers if you reference the content you've shared with me." : "";
    
    const topicResponses: Record<string, string[]> = {
      mathematics: [
        `🔢 **Mathematics** is fascinating! I can help you with:\n\n• Solving equations and problems\n• Explaining mathematical concepts\n• Working through step-by-step solutions\n• Understanding different mathematical fields\n\nWhat specific math topic would you like to explore?${contextNote}`,
        `📐 **Mathematical thinking** is all about logic and problem-solving! Share your math questions or problems, and I'll help you understand:\n\n• The underlying concepts\n• Step-by-step solutions\n• Real-world applications\n• Different approaches to problems${contextNote}`,
      ],
      physics: [
        `⚡ **Physics** explains how our universe works! I can help you understand:\n\n• Fundamental forces and laws\n• Motion, energy, and matter\n• Complex physical phenomena\n• Real-world applications\n\nWhat physics concept interests you?${contextNote}`,
        `🌌 **Physics concepts** can be complex but fascinating! Share your physics questions and I'll help explain:\n\n• The underlying principles\n• Mathematical relationships\n• Practical applications\n• Visual analogies${contextNote}`,
      ],
      general: [
        `🎓 **Learning made easy!** I'm here to help you understand any topic. You can:\n\n📤 Upload images for text extraction\n❓ Ask questions on any subject\n📝 Request summaries of content\n🌐 Get translations\n🗣️ Use voice commands\n\nWhat would you like to learn about?${contextNote}`,
        `💭 **Great question!** I'm ready to help you learn and understand. I can assist with:\n\n🔍 Research and explanations\n📊 Data analysis and summaries\n🧠 Complex concept breakdown\n🌍 Multi-language support\n\nFeel free to ask me anything!${contextNote}`,
      ]
    };

    const responses = topicResponses[topic] || topicResponses.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static getIntelligentFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "🤝 **I'm here to help!** I'm your AI study assistant with these capabilities:\n\n📚 Answer questions on any academic topic\n🖼️ Extract text from images (OCR)\n📝 Create summaries of content\n🌐 Translate between languages\n🗣️ Voice interaction support\n\nTry asking me a specific question, uploading study materials, or requesting a summary!";
    }
    
    if (lowerMessage.includes('voice') || lowerMessage.includes('speak')) {
      return "🎤 **Voice features available!** I support:\n\n🗣️ Voice input - Speak your questions\n🔊 Voice output - I can read responses aloud\n🌍 Multi-language voice support\n🎯 Hands-free interaction\n\nTry the microphone button to start a voice conversation!";
    }
    
    if (lowerMessage.includes('translate') || lowerMessage.includes('language')) {
      return "🌐 **Translation ready!** I support multiple languages:\n\n🇮🇳 Hindi, Tamil, Telugu, Kannada, Malayalam\n🇪🇸 Spanish, 🇫🇷 French, 🇩🇪 German\n🇯🇵 Japanese, 🇨🇳 Chinese, 🇸🇦 Arabic\n\nShare some text and select your target language for instant translation!";
    }
    
    return `🤔 **I understand you're looking for help!** Based on your message, I can assist you with learning and understanding various topics.\n\n💡 **Try these approaches:**\n• Ask specific questions about subjects you're studying\n• Upload images of text for extraction and analysis\n• Request explanations of concepts\n• Ask for summaries of content\n\nWhat specific topic or subject would you like to explore?`;
  }

  static getStudyAnalytics() {
    return ClusteringService.getStudyStats();
  }

  static async processImageAndSummarize(text: string): Promise<{ summary: string; topic: string }> {
    const summary = await this.summarizeText(text);
    const topic = await this.detectTopic(text);
    return { summary, topic };
  }
}
