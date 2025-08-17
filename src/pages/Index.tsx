import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, GraduationCap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="mx-auto w-20 h-20 bg-gradient-cosmic rounded-3xl flex items-center justify-center shadow-cosmic">
          <div className="relative">
            <FileText className="w-10 h-10 text-primary-foreground" />
            <GraduationCap className="w-6 h-6 text-primary-foreground absolute -top-1 -right-1" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent mb-4">
            ProofChest
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Gerencie seus comprovantes acadêmicos com OCR automático
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-gradient-cosmic hover:shadow-glow transition-all duration-200 px-8 py-3"
          >
            Entrar no Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
