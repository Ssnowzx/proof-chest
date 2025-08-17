import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Upload, 
  Bell, 
  LogOut, 
  Award,
  GraduationCap,
  Receipt,
  Settings
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuOptions = [
    {
      title: 'APC',
      description: 'Atividades Práticas Curriculares',
      icon: Award,
      path: '/documents/apc',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'ACE',
      description: 'Atividades Complementares de Ensino',
      icon: GraduationCap,
      path: '/documents/ace',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'RECIBOS',
      description: 'Comprovantes de Mensalidade',
      icon: Receipt,
      path: '/documents/recibos',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'ADICIONAR IMG',
      description: 'Upload de Documentos',
      icon: Upload,
      path: '/upload',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      title: 'AVISOS',
      description: 'Comunicados e Notícias',
      icon: Bell,
      path: '/avisos',
      gradient: 'from-red-500 to-red-600'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-cosmic rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ProofChest</h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user?.is_admin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="border-primary/20 hover:bg-primary/5"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-destructive/20 hover:bg-destructive/5 text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Escolha uma das opções abaixo para gerenciar seus documentos
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {menuOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.title}
                className="group cursor-pointer transition-all duration-300 hover:shadow-cosmic hover:scale-105 border-0 shadow-lg"
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${option.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Sistema de gestão de comprovantes acadêmicos com OCR automático
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;