import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { z } from "zod";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const emailSchema = z
  .string()
  .email("Email inválido")
  .max(255, "Email muito longo");

const passwordSchema = z
  .string()
  .min(6, "Senha deve ter no mínimo 6 caracteres")
  .max(72, "Senha muito longa");

const Auth = () => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateLoginInputs = () => {
    try {
      emailSchema.parse(loginEmail.trim());
      passwordSchema.parse(loginPassword);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }

      return false;
    }
  };

  const validateSignupInputs = () => {
    try {
      emailSchema.parse(signupEmail.trim());
      passwordSchema.parse(signupPassword);

      if (signupPassword !== signupConfirmPassword) {
        toast({
          title: "Senhas diferentes",
          description: "A confirmação de senha precisa ser igual à senha.",
          variant: "destructive",
        });

        return false;
      }

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }

      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignupInputs()) return;

    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro no cadastro",
        description:
          error.message === "User already registered"
            ? "Este email já está cadastrado. Tente fazer login."
            : "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });

      return;
    }

    toast({
      title: "Conta criada!",
      description: "Você foi cadastrado com sucesso.",
    });

    setActiveTab("login");
    setLoginEmail(signupEmail);
    setLoginPassword("");
    setSignupPassword("");
    setSignupConfirmPassword("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginInputs()) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro no login",
        description:
          error.message === "Invalid login credentials"
            ? "Email ou senha incorretos."
            : "Não foi possível fazer login. Tente novamente.",
        variant: "destructive",
      });

      return;
    }

    toast({
      title: "Bem-vindo!",
      description: "Login realizado com sucesso.",
    });
  };

  const handleForgotPassword = async () => {
    const emailToRecover =
      activeTab === "login" ? loginEmail.trim() : signupEmail.trim();

    try {
      emailSchema.parse(emailToRecover);
    } catch {
      toast({
        title: "Informe seu email",
        description: "Digite um email válido antes de recuperar a senha.",
        variant: "destructive",
      });

      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      emailToRecover,
      {
        redirectTo: `${window.location.origin}/auth`,
      }
    );

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao recuperar senha",
        description:
          "Não foi possível enviar o email de recuperação agora.",
        variant: "destructive",
      });

      return;
    }

    toast({
      title: "Email enviado",
      description:
        "Se esse email estiver cadastrado, você receberá instruções para redefinir a senha.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm overflow-hidden border shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-primary via-blue-500 to-cyan-400" />

        <CardHeader className="space-y-1 text-center pb-3 pt-6 px-6">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Gestão Financeira
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Sua carteira inteligente com análise comportamental e IA local.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "login" | "signup")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg p-1">
              <TabsTrigger value="login" className="rounded-md text-xs py-1.5">
                Login
              </TabsTrigger>

              <TabsTrigger value="signup" className="rounded-md text-xs py-1.5">
                Cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="h-[330px] flex flex-col justify-between mt-4">
                <div className="space-y-3">
                  <div className="rounded-xl border bg-primary/5 p-3 text-xs text-muted-foreground">
                    ✨ Controle, previsão e inteligência para organizar suas finanças de forma simples e intuitiva.
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="login-email" className="text-xs">Email</Label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="login-password" className="text-xs">Senha</Label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-9 pr-10 h-10 text-sm"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowLoginPassword((current) => !current)
                        }
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        disabled={loading}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground leading-normal">
                    🔒 Seus dados financeiros são processados e armazenados localmente de forma segura.
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="h-[330px] flex flex-col justify-between mt-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs">Email</Label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-password" className="text-xs">Senha</Label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-9 pr-10 h-10 text-sm"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowSignupPassword((current) => !current)
                        }
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        disabled={loading}
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-confirm-password" className="text-xs">
                      Confirmar senha
                    </Label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                      <Input
                        id="signup-confirm-password"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={signupConfirmPassword}
                        onChange={(e) =>
                          setSignupConfirmPassword(e.target.value)
                        }
                        required
                        disabled={loading}
                        className="pl-9 pr-10 h-10 text-sm"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowSignupConfirmPassword((current) => !current)
                        }
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        disabled={loading}
                      >
                        {showSignupConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground leading-normal">
                    🔒 Seus dados financeiros são processados e armazenados localmente de forma segura.
                  </div>

                  <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;