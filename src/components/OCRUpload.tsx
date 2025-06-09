import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Camera, FileText, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OCRService, ClusteringService } from "@/services/ocrService";

interface OCRUploadProps {
  onTextExtracted: (text: string) => void;
}

const OCRUpload = ({ onTextExtracted }: OCRUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const text = await OCRService.extractTextFromImage(file, setProgress);
      
      if (text.trim()) {
        setExtractedText(text);
        onTextExtracted(text);
        
        // Track OCR interaction
        ClusteringService.addInteraction(
          'ocr',
          `Extracted text from image: ${file.name}`,
          'image-processing',
          text.substring(0, 100) + (text.length > 100 ? '...' : '')
        );
        
        toast({
          title: "Text Extracted Successfully!",
          description: "Your image has been processed and text extracted.",
        });
      } else {
        toast({
          title: "No Text Found",
          description: "Could not extract text from this image. Please try a clearer image.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      processImage(files[0]);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive"
      });
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImage(files[0]);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    toast({
      title: "Copied!",
      description: "Extracted text copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="h-16 w-16 text-green-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold mb-2">Image to Text Extraction</h3>
        <p className="text-gray-600">Upload images or documents to extract text using AI OCR</p>
      </div>

      {!isProcessing && !extractedText && (
        <Card
          className={`border-2 border-dashed transition-all duration-300 cursor-pointer hover:border-green-500 hover:bg-green-50 ${
            isDragging ? "border-green-500 bg-green-50 scale-105" : "border-gray-300"
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
        >
          <CardContent className="p-12 text-center">
            <Upload className={`h-12 w-12 mx-auto mb-4 text-gray-400 transition-colors ${
              isDragging ? "text-green-500" : ""
            }`} />
            <h4 className="text-lg font-medium mb-2">Drop your image here</h4>
            <p className="text-gray-600 mb-4">or click to browse files</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </label>
            </Button>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-2 animate-spin" />
              <h4 className="font-medium">Processing Image...</h4>
              <p className="text-sm text-gray-600">AI is extracting text from your image</p>
            </div>
            <Progress value={progress} className="mb-2" />
            <p className="text-center text-sm text-gray-600">{progress}% Complete</p>
          </CardContent>
        </Card>
      )}

      {extractedText && !isProcessing && (
        <Card className="bg-green-50 border-green-200 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-green-800">Extracted Text</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={copyText}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200 max-h-64 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap">{extractedText}</p>
            </div>
            <Button
              className="w-full mt-4 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              onClick={() => {
                setExtractedText("");
                setProgress(0);
              }}
            >
              Upload Another Image
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OCRUpload;
