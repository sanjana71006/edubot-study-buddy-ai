
export class TranslationService {
  private static readonly SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'hi': 'Hindi',
    'ar': 'Arabic'
  };

  static getSupportedLanguages() {
    return this.SUPPORTED_LANGUAGES;
  }

  static async translateText(text: string, targetLang: string): Promise<string> {
    try {
      // Using a free translation API - MyMemory
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
      );
      
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback for common phrases
      const fallbackTranslations: Record<string, Record<string, string>> = {
        'es': {
          'Hello': 'Hola',
          'Thank you': 'Gracias',
          'Please': 'Por favor',
          'Yes': 'Sí',
          'No': 'No'
        },
        'fr': {
          'Hello': 'Bonjour',
          'Thank you': 'Merci',
          'Please': 'S\'il vous plaît',
          'Yes': 'Oui',
          'No': 'Non'
        },
        'hi': {
          'Hello': 'नमस्ते',
          'Thank you': 'धन्यवाद',
          'Please': 'कृपया',
          'Yes': 'हाँ',
          'No': 'नहीं'
        }
      };
      
      if (fallbackTranslations[targetLang] && fallbackTranslations[targetLang][text]) {
        return fallbackTranslations[targetLang][text];
      }
      
      return `[Translation to ${targetLang} not available: ${text}]`;
    }
  }

  static async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 100))}&langpair=autodetect|en`
      );
      
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData.match) {
        return data.responseData.match;
      }
      
      return 'en'; // Default to English
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }
}
