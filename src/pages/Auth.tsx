
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const redirectPath = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (user) {
      console.log("Usuário autenticado, redirecionando para:", redirectPath);
      navigate(redirectPath);
    }
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    console.log("Tentando autenticação:", { isLogin, email });

    try {
      if (isLogin) {
        console.log("Fazendo login...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          console.error("Erro no login:", error);
          throw error;
        }
        
        console.log("Login bem-sucedido:", data);
      } else {
        console.log("Criando conta...");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectPath}`,
          },
        });
        
        if (error) {
          console.error("Erro no cadastro:", error);
          throw error;
        }
        
        console.log("Cadastro realizado:", data);
        
        if (data.user && !data.session) {
          setSuccess("Verifique seu email para confirmar a conta antes de fazer login!");
          setIsLogin(true);
          return;
        }
        
        if (data.session) {
          console.log("Usuário logado automaticamente após cadastro");
          setSuccess("Conta criada com sucesso!");
        }
      }
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      
      let errorMessage = error.message;
      
      // Tratar erros específicos
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message?.includes("Unable to validate email address")) {
        errorMessage = "Email inválido. Verifique o formato do email.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Email não confirmado. Verifique sua caixa de entrada.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log("Tentando login com Google...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });
      if (error) {
        console.error("Erro no login com Google:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Erro no Google Auth:", error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <BackButton onClick={() => navigate("/")} label="Voltar para Home" />
        
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "Login" : "Criar Conta"}
            </CardTitle>
            {searchParams.get('redirect') && (
              <p className="text-sm text-blue-100 mt-2">
                Faça login para visualizar o contrato
              </p>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Carregando..." : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="text-sm"
                disabled={loading}
              >
                {isLogin ? "Não tem conta? Criar uma" : "Já tem conta? Fazer login"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
