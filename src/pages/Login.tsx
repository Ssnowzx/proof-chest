import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, GraduationCap } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    if (isSignUp) {
      if (password !== confirmPassword) {
        alert("As senhas não coincidem");
        setIsLoading(false);
        return;
      }
      const success = await signUp(username, password);
      setIsLoading(false);
      if (success) navigate("/dashboard");
    } else {
      const success = await login(username, password);
      setIsLoading(false);
      if (success) navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-cosmic rounded-2xl flex items-center justify-center shadow-cosmic">
            <div className="relative">
              <FileText className="w-8 h-8 text-primary-foreground" />
              <GraduationCap className="w-4 h-4 text-primary-foreground absolute -top-1 -right-1" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
              ProofChest
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus comprovantes acadêmicos
            </p>
          </div>
        </div>

        {/* Login / SignUp Form */}
        <Card className="shadow-lg border-0 shadow-cosmic/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isSignUp ? "Criar Conta" : "Entrar"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp
                ? "Crie uma nova conta"
                : "Digite suas credenciais para acessar o sistema"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="transition-all duration-200 focus:shadow-glow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="transition-all duration-200 focus:shadow-glow"
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme a Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="transition-all duration-200 focus:shadow-glow"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-cosmic hover:shadow-glow transition-all duration-200"
                disabled={
                  isLoading ||
                  !username ||
                  !password ||
                  (isSignUp && !confirmPassword)
                }
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isSignUp ? "Criando conta..." : "Entrando..."}
                  </>
                ) : isSignUp ? (
                  "Criar Conta"
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="text-center mt-4">
              <button
                className="text-sm text-primary underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp
                  ? "Já tem uma conta? Entrar"
                  : "Não tem conta? Criar conta"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Credenciais de demonstração:</p>
          <p>
            <strong>Usuário:</strong> admin | <strong>Senha:</strong> admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
