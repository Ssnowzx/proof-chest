import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Settings, Plus, Trash2, Edit, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aviso {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null as File | null
  });

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    loadAvisos();
  }, [user, navigate]);

  const loadAvisos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvisos(data || []);
    } catch (error) {
      console.error('Error loading avisos:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = null;

      // Upload image if provided
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avisos')
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avisos')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      if (editingAviso) {
        // Update existing aviso
        const updateData: any = {
          title: formData.title,
          description: formData.description
        };
        
        if (imageUrl) {
          updateData.image_url = imageUrl;
        }

        const { error } = await supabase
          .from('avisos')
          .update(updateData)
          .eq('id', editingAviso.id);

        if (error) throw error;
        toast.success('Aviso atualizado com sucesso!');
      } else {
        // Create new aviso
        const { error } = await supabase
          .from('avisos')
          .insert({
            title: formData.title,
            description: formData.description,
            image_url: imageUrl
          });

        if (error) throw error;
        toast.success('Aviso criado com sucesso!');
      }

      // Reset form
      setFormData({ title: '', description: '', image: null });
      setEditingAviso(null);
      loadAvisos();
    } catch (error) {
      console.error('Error saving aviso:', error);
      toast.error('Erro ao salvar aviso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (aviso: Aviso) => {
    setEditingAviso(aviso);
    setFormData({
      title: aviso.title,
      description: aviso.description || '',
      image: null
    });
  };

  const handleDelete = async (avisoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    try {
      const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', avisoId);

      if (error) throw error;
      
      setAvisos(avisos.filter(aviso => aviso.id !== avisoId));
      toast.success('Aviso excluído com sucesso');
    } catch (error) {
      console.error('Error deleting aviso:', error);
      toast.error('Erro ao excluir aviso');
    }
  };

  const cancelEdit = () => {
    setEditingAviso(null);
    setFormData({ title: '', description: '', image: null });
  };

  if (!user?.is_admin) {
    return null;
  }

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
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gerenciar avisos do sistema</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card className="shadow-lg border-0 shadow-cosmic/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {editingAviso ? 'Editar Aviso' : 'Novo Aviso'}
                </CardTitle>
                <CardDescription>
                  {editingAviso 
                    ? 'Atualize as informações do aviso' 
                    : 'Crie um novo aviso para todos os usuários'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Digite o título do aviso"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Digite a descrição detalhada do aviso"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      disabled={submitting}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Imagem (opcional)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                      disabled={submitting}
                      className="file:text-primary-foreground file:bg-primary file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
                      disabled={submitting || !formData.title.trim()}
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Salvando...
                        </>
                      ) : editingAviso ? (
                        'Atualizar Aviso'
                      ) : (
                        'Criar Aviso'
                      )}
                    </Button>
                    {editingAviso && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={submitting}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Avisos List */}
          <div>
            <Card className="shadow-lg border-0 shadow-cosmic/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Avisos Cadastrados
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {avisos.length} avisos
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : avisos.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum aviso cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {avisos.map((aviso) => (
                      <div
                        key={aviso.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium line-clamp-1">{aviso.title}</h4>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(aviso)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(aviso.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {aviso.image_url && (
                          <div className="mb-2">
                            <img
                              src={aviso.image_url}
                              alt={aviso.title}
                              className="w-full h-32 object-cover rounded-md"
                            />
                          </div>
                        )}
                        {aviso.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {aviso.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(aviso.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;