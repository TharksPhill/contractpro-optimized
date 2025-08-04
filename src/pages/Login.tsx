
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Building2, Lock, User, ArrowRight, Mail, Eye, EyeOff, ArrowLeft, Shield, Zap, Users } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular autenticação
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === "admin@contratos.com" && password === "123456") {
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao ContractPro!",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular envio de email de recuperação
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Email enviado!",
      description: "Verifique sua caixa de entrada para redefinir sua senha.",
    });

    setIsLoading(false);
    setShowForgotPassword(false);
    setResetEmail("");
  };

  const goBack = () => {
    navigate("/");
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="w-full max-w-md relative z-10">
          <Button
            variant="ghost"
            onClick={() => setShowForgotPassword(false)}
            className="mb-6 text-white/80 hover:text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Login
          </Button>

          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-xl">
                  <Mail className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Recuperar Senha
              </CardTitle>
              <CardDescription className="text-blue-200 text-lg">
                Digite seu email para receber as instruções de recuperação
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-sm font-medium text-white/90">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-blue-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Digite seu email"
                      className="pl-12 h-14 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:bg-white/20 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-lg shadow-xl" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Enviando...
                    </div>
                  ) : (
                    "Enviar Instruções"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)] animate-pulse"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-5xl relative z-10 grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Brand and Features */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  ContractPro
                </h1>
                <p className="text-blue-200 text-lg">Sistema Profissional de Gestão</p>
              </div>
            </div>
            
            <p className="text-xl text-blue-100 leading-relaxed">
              Transforme a gestão dos seus contratos com nossa plataforma avançada e intuitiva.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Segurança Avançada</h3>
                <p className="text-blue-200">Proteção de dados com criptografia de ponta</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Automação Inteligente</h3>
                <p className="text-blue-200">Workflows automatizados para maior eficiência</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Colaboração em Equipe</h3>
                <p className="text-blue-200">Trabalhe em conjunto de forma organizada</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Button
            variant="ghost"
            onClick={goBack}
            className="mb-6 text-white/80 hover:text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
          </Button>

          <Card className="shadow-2xl border-0 bg-white/10 backdrop-blur-lg border border-white/20">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6 lg:hidden">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription className="text-blue-200 text-lg">
                Acesse sua conta para continuar
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/90">
                    E-mail
                  </Label>
                  <div className="relative">
                    <User className="w-5 h-5 text-blue-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-12 h-14 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:bg-white/20 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/90">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-blue-300 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="pl-12 pr-12 h-14 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:bg-white/20 backdrop-blur-sm"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-white/20 text-blue-300 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="w-4 h-4 text-blue-500 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="remember" className="text-sm text-white/80">
                      Lembrar-me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-blue-300 hover:text-blue-200 p-0 h-auto font-medium"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueceu a senha?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-lg shadow-xl transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      Entrar
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-white/70">
                  Não tem uma conta?{" "}
                  <Button
                    variant="link"
                    className="text-sm text-blue-300 hover:text-blue-200 p-0 h-auto font-medium"
                    onClick={() => navigate("/auth")}
                  >
                    Criar uma conta
                  </Button>
                </p>
              </div>
              
              <div className="mt-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm">
                <p className="text-sm text-blue-200 text-center mb-3 font-medium">
                  Dados para demonstração:
                </p>
                <div className="text-xs text-blue-100 text-center space-y-1">
                  <p><strong className="text-white">Email:</strong> admin@contratos.com</p>
                  <p><strong className="text-white">Senha:</strong> 123456</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <p className="text-white/60 text-sm">
              &copy; {new Date().getFullYear()} ContractPro - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
