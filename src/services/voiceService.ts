
// Add type declarations for Speech API
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export class VoiceService {
  private static recognition: SpeechRecognition | null = null;
  private static synthesis: SpeechSynthesis = window.speechSynthesis;
  private static currentLanguage: string = 'en-US';
  private static _isSpeaking: boolean = false;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  static async initializeSpeechRecognition(language: string = 'en-US'): Promise<SpeechRecognition> {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      throw new Error('Speech recognition not supported in this browser');
    }
    
    this.recognition = new SpeechRecognitionClass();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = language;
    this.currentLanguage = language;
    
    return this.recognition;
  }

  static async startListening(language: string = 'en-US'): Promise<string> {
    if (!this.recognition || this.currentLanguage !== language) {
      await this.initializeSpeechRecognition(language);
    }
    
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      
      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      this.recognition.start();
    });
  }

  static stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  static async speak(text: string, lang: string = 'en-US', rate: number = 0.9): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }
    
    // Always cancel any current speech before starting new one
    this.forceStop();
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Store current utterance reference
      this.currentUtterance = utterance;
      
      // Try to find a voice that matches the language
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.onstart = () => {
        this._isSpeaking = true;
      };
      
      utterance.onend = () => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        this._isSpeaking = false;
        this.currentUtterance = null;
        // Don't reject on 'interrupted' error as it's expected when stopping
        if (event.error !== 'interrupted') {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        } else {
          resolve();
        }
      };
      
      this.synthesis.speak(utterance);
    });
  }

  static async speakResponse(response: string, language: string = 'en-US'): Promise<void> {
    // Clean the response text for better speech synthesis
    const cleanedResponse = response
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/📚|💡|🎯|📖|🔍|📊|📄|✅|❌|🌐|🔍/g, '') // Remove emojis
      .replace(/\n\n/g, '. ') // Replace double newlines with periods
      .replace(/\n/g, ' ') // Replace single newlines with spaces
      .trim();

    return this.speak(cleanedResponse, language);
  }

  static forceStop(): void {
    // Cancel all speech synthesis
    this.synthesis.cancel();
    this._isSpeaking = false;
    this.currentUtterance = null;
  }

  static stopSpeaking(): void {
    this.forceStop();
  }

  static isSpeaking(): boolean {
    return this._isSpeaking;
  }

  static getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  static getAvailableLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ta-IN', name: 'Tamil' },
      { code: 'te-IN', name: 'Telugu' },
      { code: 'kn-IN', name: 'Kannada' },
      { code: 'ml-IN', name: 'Malayalam' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'zh-CN', name: 'Chinese' }
    ];
  }

  static async startConversation(): Promise<string> {
    try {
      await this.speak("Hello! I'm EduBot. How can I help you with your studies today?");
      return await this.startListening();
    } catch (error) {
      throw error;
    }
  }
}
