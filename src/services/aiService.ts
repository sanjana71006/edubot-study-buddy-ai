
import { pipeline } from '@huggingface/transformers';

export class AIService {
  private static summarizer: any = null;
  private static qaModel: any = null;
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
      
      this.initialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU');
      
      // Fallback to CPU
      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
      this.qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
      
      this.initialized = true;
    }
  }

  static async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    await this.initialize();
    
    if (text.length < 100) {
      return "Text is too short to summarize effectively.";
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

  static async answerQuestion(context: string, question: string): Promise<{ answer: string; confidence: number }> {
    await this.initialize();
    
    if (!context || !question) {
      throw new Error('Both context and question are required');
    }
    
    try {
      const result = await this.qaModel(question, context);
      
      return {
        answer: result.answer,
        confidence: Math.round(result.score * 100)
      };
    } catch (error) {
      console.error('Q&A error:', error);
      throw new Error('Failed to answer question');
    }
  }

  static async generateResponse(message: string, context?: string): Promise<string> {
    // Simple response generation based on context
    if (context) {
      if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary')) {
        return await this.summarizeText(context);
      }
      
      if (message.includes('?')) {
        const result = await this.answerQuestion(context, message);
        return `${result.answer} (Confidence: ${result.confidence}%)`;
      }
    }
    
    // Default responses for general chat
    const responses = [
      "I understand your question. Could you provide more context or upload some content for me to analyze?",
      "That's an interesting point! Feel free to share any documents or images related to this topic.",
      "I'm here to help with your studies. You can upload images, ask questions about uploaded content, or request summaries.",
      "Let me know if you'd like me to analyze any specific content or answer questions about your study materials."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
