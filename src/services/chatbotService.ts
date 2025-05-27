
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  sessionId: string;
}

export class ChatbotService {
  private static apiKey: string = '';
  private static baseUrl: string = 'https://api.openai.com/v1/chat/completions';
  private static currentState: ChatState = {
    messages: [],
    sessionId: this.generateSessionId()
  };

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static hasApiKey(): boolean {
    return !!this.apiKey;
  }

  private static generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  static initializeSession(): void {
    this.currentState = {
      messages: [{
        role: 'system',
        content: 'You are EduBot, an intelligent academic assistant. Help students with their studies by providing clear explanations, summaries, and answers to academic questions. Be encouraging and educational in your responses.',
        timestamp: new Date()
      }],
      sessionId: this.generateSessionId()
    };
  }

  static addMessage(role: 'user' | 'assistant', content: string): void {
    this.currentState.messages.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  static getMessages(): ChatMessage[] {
    return this.currentState.messages.filter(msg => msg.role !== 'system');
  }

  static async sendMessage(userMessage: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not configured. Please set your API key first.');
    }

    // Add user message to state
    this.addMessage('user', userMessage);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: this.currentState.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      // Add assistant message to state
      this.addMessage('assistant', assistantMessage);

      return assistantMessage;
    } catch (error) {
      console.error('Chatbot API error:', error);
      throw new Error('Failed to get response from chatbot. Please check your API key and try again.');
    }
  }

  static async streamResponse(userMessage: string, onToken: (token: string) => void): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key not configured.');
    }

    this.addMessage('user', userMessage);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: this.currentState.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: 500,
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices[0]?.delta?.content || '';
              if (token) {
                assistantMessage += token;
                onToken(token);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      this.addMessage('assistant', assistantMessage);
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  static clearConversation(): void {
    this.initializeSession();
  }

  static exportConversation(): string {
    return JSON.stringify({
      sessionId: this.currentState.sessionId,
      messages: this.getMessages(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}
