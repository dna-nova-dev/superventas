import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usuarioService } from "@/services/usuarioService";
import { AuthService } from "@/services/auth.service"; // Import AuthService
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Info, ArrowRight, UserPlus, Sun, Moon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { getEmpresaByEmpleadoId, getEmpresaByUsuarioId } from "@/services/empresaService";
const Login = () => {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser, setEmpresa, setEmpresaId } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerCompanyName, setRegisterCompanyName] = useState("");
  const [registerContactName, setRegisterContactName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [registerCountryCode, setRegisterCountryCode] = useState("+51");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [loginProgress, setLoginProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const calculatePasswordStrength = () => {
      const password = registerPassword;
      let strength = 0;

      if (password.length >= 8) strength += 25;
      if (/[A-Z]/.test(password)) strength += 25;
      if (/[a-z]/.test(password)) strength += 25;
      if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength += 25;

      setPasswordStrength(strength);
    };

    calculatePasswordStrength();
  }, [registerPassword]);

  useEffect(() => {
    const checkFormComplete = () => {
      setIsFormComplete(
        registerCompanyName !== "" &&
          registerContactName !== "" &&
          registerEmail !== "" &&
          registerPhone !== "" &&
          registerPassword !== "" &&
          passwordStrength === 100
      );
    };

    checkFormComplete();
  }, [registerPassword, registerCompanyName, registerContactName, registerEmail, registerPhone, passwordStrength]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isTransitioning) {
        setLoginProgress((prevProgress) => {
          const newProgress = prevProgress + 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [isTransitioning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await usuarioService.login({ username, password }); 
      AuthService.setToken(data.access_token); 
      
      setUser(data.user);
      console.log("Usuario:", data.user);
      if (data.user.cargo === "Administrador" ) {
        const empresa = await getEmpresaByUsuarioId(data.user.id); 
        setEmpresa(empresa);
      }
      if (data.user.cargo === "Encargado" || data.user.cargo === "Cajero") {
        const empresa = await getEmpresaByEmpleadoId(data.user.id);
        console.log("Empresa de empleado:", empresa);
        setEmpresa(empresa); 
      }
      
      toast({
        variant: "default",
        title: "Bienvenido",
        description: `Inicio de sesión exitoso, ${data.user.nombre}`, 
      });
      setIsTransitioning(true);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Credenciales inválidas",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Recuperación de contraseña",
      description: `Se ha enviado un correo a ${recoveryEmail} con instrucciones para restablecer tu contraseña.`,
    });
    setIsRecoveryOpen(false);
    setRecoveryEmail("");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!termsAccepted) {
        toast({
          variant: "destructive",
          title: "Error de registro",
          description: "Debes aceptar los términos y condiciones para registrarte.",
        });
        setLoading(false);
        return;
      }
      toast({
        title: "Registro exitoso",
        description: `¡Bienvenido, ${registerCompanyName}! Ahora puedes iniciar sesión.`,
      });
      setIsRegistering(false);
      setLoading(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error instanceof Error ? error.message : "No se pudo completar el registro.",
      });
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const countryCodes = [
    { label: "Perú", code: "+51" },
    { label: "Mexico", code: "+52" },
    { label: "Guatemala", code: "+502" },
  ];

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterPassword(e.target.value);
    setPasswordTouched(true);
  };

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>
        {isTransitioning ? (
          <motion.div
            key="transition"
            className="fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-white dark:bg-zinc-900 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-500">Super Ventas</h1>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                Beta <span className="opacity-60">v1.0</span>
              </span>
            </div>
            <p className="text-lg mt-4 text-gray-900 dark:text-gray-100">Accediendo al sistema...</p>
            <Progress value={loginProgress} className="w-64 mt-4" />
          </motion.div>
        ) : (
          <>
            {/* Left Section: Login Form */}
            <div className="flex flex-col justify-center w-full max-w-md p-8 space-y-6 shadow-lg rounded-lg relative">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-blue-600">Super Ventas</h1>
                  <span className="text-xs px-2 py-1 bg-white dark:bg-gray-700 text-white rounded-full">
                    Beta <span className="opacity-60">v1.0</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTheme()}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>

              {/* Welcome Message */}
              <div>
                <h2 className="text-xl font-bold">¡Hola! 👋</h2>
                <p className="text-sm text-gray-600">
                  {isRegistering
                    ? "Crea una cuenta para empezar a usar Super Ventas."
                    : "Accede para potenciar tus ventas y administrar tu negocio con facilidad."}
                </p>
              </div>

              {/* Login Form */}
              {!isRegistering ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Input
                      id="username" // Changed id
                      type="text" // Changed type
                      value={username} // Changed value
                      onChange={(e) => setUsername(e.target.value)} // Changed handler
                      placeholder="Nombre de usuario" // Changed placeholder
                      required
                    />
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsRecoveryOpen(true)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? "Ingresando..." : (
                      <>
                        Iniciar Sesión
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    ¿No tienes una cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Regístrate aquí
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        id="register-company-name"
                        type="text"
                        value={registerCompanyName}
                        onChange={(e) => setRegisterCompanyName(e.target.value)}
                        placeholder="Nombre de la empresa"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        id="register-contact-name"
                        type="text"
                        value={registerContactName}
                        onChange={(e) => setRegisterContactName(e.target.value)}
                        placeholder="Nombre del contacto"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="Correo electrónico"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={registerCountryCode}
                      onValueChange={setRegisterCountryCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Lada" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.label} ({country.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="register-phone"
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="Teléfono"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={registerPassword}
                      onChange={handlePasswordChange}
                      placeholder="Contraseña"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordTouched && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password-strength">Fortaleza de la contraseña</Label>
                        <Popover>
                          <PopoverTrigger>
                            <button
                              type="button"
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">La contraseña debe cumplir con los siguientes requisitos:</p>
                              <ul className="list-disc pl-5 text-sm">
                                <li>Tener al menos 8 caracteres</li>
                                <li>Incluir al menos una letra mayúscula</li>
                                <li>Incluir al menos una letra minúscula</li>
                                <li>Incluir al menos un número o carácter especial</li>
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Progress id="password-strength" value={passwordStrength} className="h-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {passwordStrength < 50
                          ? "Contraseña débil"
                          : passwordStrength < 80
                          ? "Contraseña moderada"
                          : "Contraseña fuerte"}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                        disabled={!isFormComplete}
                      />
                      <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Acepto los <a href="#" className="text-blue-600 hover:underline">términos y condiciones</a>
                      </Label>
                    </div>
                  </div>
                  <Button className="w-full" type="submit" disabled={loading || !termsAccepted || !isFormComplete}>
                    {loading ? "Registrando..." : (
                      <>
                        Registrar
                        <UserPlus className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    ¿Ya tienes una cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegistering(false)}
                      className="text-blue-600 hover:underline"
                    >
                      Inicia sesión
                    </button>
                  </div>
                </form>
              )}

              {/* Copyright Footer */}
              <div className="absolute bottom-0 left-0 w-full text-center text-sm text-gray-600 dark:text-gray-400 py-2">
                <p>© {currentYear} Super Ventas. Todos los derechos reservados.</p>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Right Section: Aura Effect */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 blur-3xl opacity-70 animate-gradient"></div>
      </div>

      {/* Password Recovery Dialog */}
      <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recuperar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Correo electrónico</Label>
              <Input
                id="recovery-email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Enviar instrucciones</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
