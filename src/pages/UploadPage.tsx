import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Upload, Camera, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [preview, setPreview] = useState<string>('');

  const categories = [
    { value: 'APC', label: 'APC - Atividades Práticas Curriculares' },
    { value: 'ACE', label: 'ACE - Atividades Complementares de Ensino' },
    { value: 'RECIBO', label: 'RECIBOS - Comprovantes de Mensalidade' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setExtractedText('');
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      setOcrProgress(0);
      
      const result = await Tesseract.recognize(file, 'por', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            setOcrProgress(Math.round(info.progress * 100));
          }
        }
      });

      return result.data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw error;
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !category || !user) {
      toast.error('Selecione um arquivo e uma categoria');
      return;
    }

    try {
      setLoading(true);
      
      // Extract text using OCR
      toast.info('Extraindo texto da imagem...');
      const extractedText = await extractTextFromImage(selectedFile);
      setExtractedText(extractedText);

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Save document record to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          category,
          image_url: fileName,
          extracted_text: extractedText
        });

      if (dbError) throw dbError;

      toast.success('Documento salvo com sucesso!');
      
      // Navigate to the category page
      const categoryPath = category.toLowerCase() === 'recibo' ? 'recibos' : category.toLowerCase();
      navigate(`/documents/${categoryPath}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao salvar documento');
    } finally {
      setLoading(false);
      setOcrProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Adicionar Documento</h1>
            <p className="text-sm text-muted-foreground">Upload com OCR automático</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg border-0 shadow-cosmic/20">
          <CardHeader>
            <CardTitle>Upload de Documento</CardTitle>
            <CardDescription>
              Selecione uma imagem e categoria. O sistema extrairá o texto automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria do Documento</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Imagem do Documento</label>
              
              {!selectedFile ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Adicione sua imagem</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste e solte ou clique para selecionar
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Escolher Arquivo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCameraCapture}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Câmera
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  
                  {/* File Info */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview('');
                        setExtractedText('');
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* OCR Progress */}
            {loading && ocrProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Extraindo texto...</span>
                  <span>{ocrProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Extracted Text Preview */}
            {extractedText && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto Extraído</label>
                <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{extractedText}</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              className="w-full bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
              onClick={uploadDocument}
              disabled={!selectedFile || !category || loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Salvar Documento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default UploadPage;