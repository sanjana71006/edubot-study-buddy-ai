
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private static apiKey: string = '';
  private static baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  static setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
  }

  static getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('gemini_api_key') || '';
    }
    return this.apiKey;
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static clearApiKey() {
    this.apiKey = '';
    localStorage.removeItem('gemini_api_key');
  }

  static async generateResponse(userMessage: string, context?: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    let prompt = '';
    if (context) {
      prompt = `You are an expert AI tutor that helps students with all academic subjects including Mathematics, Science, Physics, Chemistry, Biology, Computer Science, Programming (Java, Python, C++, JavaScript, etc.), Machine Learning, Engineering, and more.

Context: ${context}

User Question: ${userMessage}

Provide a comprehensive, educational answer that:
- Is based on the context when relevant
- Includes step-by-step explanations for complex topics
- Uses examples and analogies to clarify concepts
- Covers code examples for programming questions
- Shows mathematical calculations step by step
- Is encouraging and educational

Answer:`;
    } else {
      prompt = `You are an expert AI tutor that helps students with all academic subjects including Mathematics, Science, Physics, Chemistry, Biology, Computer Science, Programming (Java, Python, C++, JavaScript, etc.), Machine Learning, Engineering, and more.

User Question: ${userMessage}

Provide a comprehensive, educational answer that:
- Includes detailed explanations and examples
- Shows step-by-step solutions for math/science problems
- Provides code examples for programming questions
- Uses clear, educational language
- Is encouraging and supportive
- Covers the topic thoroughly

Answer:`;
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      
      return aiResponse;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to get response from Gemini AI. Please check your API key and try again.');
    }
  }

  static async summarizeText(text: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Please create a comprehensive summary of the following text. Focus on key points, main concepts, and important details:

${text}

Summary:`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Summary could not be generated.';
    } catch (error) {
      console.error('Gemini summarization error:', error);
      throw new Error('Failed to generate summary with Gemini AI.');
    }
  }
}
