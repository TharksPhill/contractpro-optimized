import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Eye, EyeOff, ArrowRight, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NewLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Verificar se há tokens de recuperação na URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    console.log("Parâmetros da URL:", { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

    if (accessToken && refreshToken && type === 'recovery') {
      console.log("Token de recuperação detectado, iniciando processo de redefinição");
      handlePasswordRecovery(accessToken, refreshToken);
    }
  }, [searchParams]);

  // Se o usuário já estiver logado, redirecionar para o dashboard
  useEffect(() => {
    if (user && !showResetPassword) {
      navigate("/dashboard");
    }
  }, [user, navigate, showResetPassword]);

  const handlePasswordRecovery = async (accessToken: string, refreshToken: string) => {
    try {
      console.log("Processando recuperação de senha...");
      
      // Definir a sessão com os tokens da URL
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        console.error("Erro ao definir sessão:", error);
        toast({
          title: "Erro no link de recuperação",
          description: "O link de recuperação é inválido ou expirou. Solicite um novo.",
          variant: "destructive",
        });
        return;
      }

      console.log("Sessão definida com sucesso:", data);
      setShowResetPassword(true);
      
      toast({
        title: "Link válido",
        description: "Agora você pode definir uma nova senha.",
      });

    } catch (error) {
      console.error("Erro inesperado na recuperação:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o link de recuperação.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Atualizando senha...");
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error("Erro ao atualizar senha:", error);
        toast({
          title: "Erro ao atualizar senha",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Senha atualizada com sucesso");
      
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso. Você já está logado.",
      });

      // Redirecionar para o dashboard
      navigate("/dashboard");
      
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Tentando fazer login com:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Erro no login:", error);
        
        let errorMessage = "Erro no login. Verifique suas credenciais.";
        
        if (error.message?.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos. Verifique suas credenciais.";
        } else if (error.message?.includes("Email not confirmed")) {
          errorMessage = "Email não confirmado. Verifique sua caixa de entrada.";
        }
        
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log("Login realizado com sucesso:", data);
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao ContractPro!",
      });
      
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Enviando email de recuperação para:", resetEmail);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/new-login`,
      });

      if (error) {
        console.error("Erro ao enviar email de recuperação:", error);
        toast({
          title: "Erro ao enviar email",
          description: "Não foi possível enviar o email de recuperação. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });

      setShowForgotPassword(false);
      setResetEmail("");
      
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de redefinição de senha (quando vem do email)
  if (showResetPassword) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Reset Password Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-8">
            {/* Logo and Brand */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Contract<span className="text-blue-600">Pro</span>
                  </h1>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  Definir Nova Senha
                </h2>
                <p className="text-gray-600">
                  Digite sua nova senha abaixo
                </p>
              </div>
            </div>

            {/* Reset Password Form */}
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mínimo 6 caracteres)"
                    className="h-12 text-base pr-12"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar nova senha"
                    className="h-12 text-base pr-12"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-full shadow-lg transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Atualizando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Atualizar Senha
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side - Brand Section */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:60px_60px]"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center text-white space-y-12 max-w-md">
            <div className="space-y-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-bold">
                    Contract<span className="text-purple-200">Pro</span>
                  </h1>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-purple-100">
                  Gestão inteligente de contratos
                </h2>
                <p className="text-purple-200 text-lg leading-relaxed">
                  Assinaturas digitais e documentos seguros em uma plataforma moderna.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                </div>
                <span className="text-purple-100">Contratos digitais</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                </div>
                <span className="text-purple-100">Assinaturas válidas</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                </div>
                <span className="text-purple-100">Dashboard avançado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de "Esqueceu a senha" (solicitar email)
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Reset Password Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Contract<span className="text-blue-600">Pro</span>
                  </h1>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  Recuperar Senha
                </h2>
                <p className="text-gray-600">
                  Digite seu email para receber as instruções
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-12 text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-full shadow-lg transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Enviar Email de Recuperação
                    </div>
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Voltar para Login
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:60px_60px]"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center text-white space-y-12 max-w-md">
            <div className="space-y-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-bold">
                    Contract<span className="text-purple-200">Pro</span>
                  </h1>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-purple-100">
                  Gestão inteligente de contratos
                </h2>
                <p className="text-purple-200 text-lg leading-relaxed">
                  Assinaturas digitais e documentos seguros em uma plataforma moderna.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                </div>
                <span className="text-purple-100">Contratos digitais</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                </div>
                <span className="text-purple-100">Assinaturas válidas</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
                </div>
                <span className="text-purple-100">Dashboard avançado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela principal de login
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900">
                  Contract<span className="text-blue-600">Pro</span>
                </h1>
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Acesso ao Sistema
              </h2>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-12 text-base"
                  required
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="h-12 text-base pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="link"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                onClick={() => setShowForgotPassword(true)}
              >
                Esqueceu a senha?
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-full shadow-lg transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:60px_60px]"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center text-white space-y-12 max-w-md">
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold">
                  Contract<span className="text-purple-200">Pro</span>
                </h1>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-purple-100">
                Gestão inteligente de contratos
              </h2>
              <p className="text-purple-200 text-lg leading-relaxed">
                Assinaturas digitais e documentos seguros em uma plataforma moderna.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
              </div>
              <span className="text-purple-100">Contratos digitais</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
              </div>
              <span className="text-purple-100">Assinaturas válidas</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-purple-200 rounded-full"></div>
              </div>
              <span className="text-purple-100">Dashboard avançado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewLogin;
