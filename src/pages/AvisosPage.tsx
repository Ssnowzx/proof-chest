import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Bell, Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface Aviso {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const AvisosPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvisos();
  }, []);

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
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Avisos</h1>
              <p className="text-sm text-muted-foreground">Comunicados e notícias importantes</p>
            </div>
          </div>
          {user?.is_admin && (
            <Button
              onClick={() => navigate('/admin')}
              className="bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Gerenciar
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : avisos.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum aviso encontrado</h3>
            <p className="text-muted-foreground">
              Não há avisos disponíveis no momento
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {avisos.map((aviso) => (
              <Card key={aviso.id} className="hover:shadow-cosmic transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{aviso.title}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(aviso.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                {aviso.description && (
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {aviso.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvisosPage;