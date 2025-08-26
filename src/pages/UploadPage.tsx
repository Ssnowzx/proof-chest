import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Upload, Camera, Image } from 'lucide-react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'APC' as 'APC' | 'ACE' | 'RECIBO',
    file: null as File | null,
    evento: '',
    horas: '',
    observacao: ''
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !user) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      setUploading(true);

      // Upload image to Supabase Storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Extract text using OCR
      let extractedText = '';
      try {
        const { data: { text } } = await Tesseract.recognize(formData.file, 'por');
        extractedText = text;
      } catch (ocrError) {
        console.error('OCR Error:', ocrError);
        toast.error('Erro ao extrair texto da imagem');
      }

      const insertData: any = {
        user_id: user.id,
        category: formData.category,
        image_url: publicUrl,
        extracted_text: extractedText
      };

      // Adicionar campos extras baseado na categoria
      if (formData.category === 'APC' || formData.category === 'ACE') {
        if (formData.evento) insertData.evento = formData.evento;
        if (formData.horas) insertData.horas = parseInt(formData.horas);
      } else if (formData.category === 'RECIBO') {
        if (formData.observacao) insertData.observacao = formData.observacao;
      }

      const { data, error } = await supabase
        .from('documents')
        .insert(insertData);

      if (error) throw error;

      toast.success('Documento salvo com sucesso!');
      
      // Reset form
      setFormData({ category: 'APC', file: null, evento: '', horas: '', observacao: '' });
      setPreview(null);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Erro ao fazer upload do documento');
    } finally {
      setUploading(false);
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
          <div className="w-10 h-10 bg-gradient-cosmic rounded-xl flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Adicionar Documento</h1>
            <p className="text-sm text-muted-foreground">Upload de comprovantes e recibos</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg border-0 shadow-cosmic/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Upload de Documento
            </CardTitle>
            <CardDescription>
              Selecione a categoria e faça upload da imagem. O texto será extraído automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  disabled={uploading}
                >
                  <option value="APC">APC</option>
                  <option value="ACE">ACE</option>
                  <option value="RECIBO">RECIBO</option>
                </select>
              </div>

              {/* Campos extras para APC e ACE */}
              {(formData.category === 'APC' || formData.category === 'ACE') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="evento">Evento</Label>
                    <Input
                      id="evento"
                      placeholder="Nome do evento"
                      value={formData.evento}
                      onChange={(e) => setFormData(prev => ({ ...prev, evento: e.target.value }))}
                      disabled={uploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horas">Horas</Label>
                    <Input
                      id="horas"
                      type="number"
                      placeholder="Quantidade de horas"
                      value={formData.horas}
                      onChange={(e) => setFormData(prev => ({ ...prev, horas: e.target.value }))}
                      disabled={uploading}
                      min="0"
                      step="1"
                    />
                  </div>
                </>
              )}

              {/* Campo extra para RECIBO */}
              {formData.category === 'RECIBO' && (
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    placeholder="Observações sobre o recibo"
                    value={formData.observacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                    disabled={uploading}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="file">Arquivo *</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="file:text-primary-foreground file:bg-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                />
              </div>

              {preview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-full h-64 object-contain mx-auto rounded-md"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
                disabled={uploading || !formData.file}
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Fazer Upload
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;