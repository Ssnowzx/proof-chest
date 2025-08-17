import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, FileText, Eye, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Document {
  id: string;
  category: string;
  image_url: string;
  extracted_text: string;
  created_at: string;
}

const DocumentsPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const categoryConfig = {
    apc: { title: 'APC', description: 'Atividades Práticas Curriculares', color: 'bg-purple-500' },
    ace: { title: 'ACE', description: 'Atividades Complementares de Ensino', color: 'bg-blue-500' },
    recibos: { title: 'RECIBOS', description: 'Comprovantes de Mensalidade', color: 'bg-green-500' }
  };

  const config = categoryConfig[category as keyof typeof categoryConfig];

  useEffect(() => {
    if (user && category) {
      loadDocuments();
    }
  }, [user, category]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .eq('category', category.toUpperCase())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setDocuments(documents.filter(doc => doc.id !== docId));
      toast.success('Documento excluído com sucesso');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erro ao excluir documento');
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${supabase.storage.from('documents').getPublicUrl(url).data.publicUrl}`;
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{config.title}</h1>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {documents.length} documentos
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não tem documentos da categoria {config.title}
            </p>
            <Button onClick={() => navigate('/upload')}>
              Adicionar Primeiro Documento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="group hover:shadow-cosmic transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {config.title} - {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocument(doc.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="flex items-center text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(doc.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Preview */}
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(doc.image_url)}
                      alt="Document"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => setSelectedDoc(doc)}
                    />
                  </div>
                  
                  {/* Extracted Text Preview */}
                  {doc.extracted_text && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <h4 className="text-xs font-medium mb-2 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Texto Extraído
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {doc.extracted_text}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {config.title} - {format(new Date(selectedDoc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDoc(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <img
                src={getImageUrl(selectedDoc.image_url)}
                alt="Document"
                className="w-full rounded-lg shadow-lg"
              />
              {selectedDoc.extracted_text && (
                <div>
                  <h3 className="font-semibold mb-3">Texto Extraído:</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedDoc.extracted_text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;