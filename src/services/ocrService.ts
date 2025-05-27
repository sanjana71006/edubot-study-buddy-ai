
import Tesseract from 'tesseract.js';

export class OCRService {
  static async extractTextFromImage(imageFile: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      return result.data.text.trim();
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  static async extractTextFromMultipleImages(imageFiles: File[]): Promise<string[]> {
    const promises = imageFiles.map(file => this.extractTextFromImage(file));
    return Promise.all(promises);
  }
}
