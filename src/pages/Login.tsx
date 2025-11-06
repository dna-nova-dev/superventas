import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usuarioService } from "@/services/usuarioService";
import { AuthService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Sun, Moon, ArrowRight } from "lucide-react";
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
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { getEmpresaByEmpleadoId, getEmpresaByUsuarioId } from "@/services/empresaService";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loginProgress, setLoginProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser, setEmpresa, setEmpresaId } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
      console.log("Datos del usuario al iniciar sesión:", data.user);
      
      // Manejar la lógica de empresa según el tipo de usuario
      try {
        if (data.user.cargo === "Administrador") {
          const empresa = await getEmpresaByUsuarioId(data.user.id);
          if (empresa) {
            setEmpresa(empresa);
          }
        } else if (data.user.cargo === "Encargado" || data.user.cargo === "Cajero") {
          const empresa = await getEmpresaByEmpleadoId(data.user.id);
          console.log("Empresa de empleado:", empresa);
          if (empresa) {
            setEmpresa(empresa);
          }
        }
        // No hacemos nada para el rol Owner ya que no necesita empresa
      } catch (error) {
        console.warn("Error al obtener datos de la empresa:", error);
        // Continuamos sin fallar, ya que no todos los roles necesitan empresa
      }
      
      // Verificar si el usuario es Owner
      const isOwner = data.user.cargo === 'Owner';
      
      // Si es Owner, forzar hasChangedPassword a true para evitar el diálogo
      if (isOwner) {
        data.user.hasChangedPassword = true;
      }
      
      // Verificar si el usuario necesita cambiar su contraseña
      const needsPasswordChange = data.user.hasChangedPassword === false || 
                                data.user.hasChangedPassword === undefined;
      
      console.log('Estado de cambio de contraseña requerido:', {
        needsPasswordChange,
        hasChangedPassword: data.user.hasChangedPassword,
        isOwner,
        userRole: data.user.cargo,
        userData: data.user
      });
      
      if (needsPasswordChange) {
        console.log('Mostrando diálogo de cambio de contraseña');
        setShowChangePassword(true);
        setLoading(false);
        return;
      }
      
      // Si llegamos aquí, el usuario no necesita cambiar la contraseña
      console.log('Inicio de sesión exitoso, redirigiendo...');
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
      console.error('Error en el inicio de sesión:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al iniciar sesión. Intente nuevamente.",
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

  const currentYear = new Date().getFullYear();

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
                  Accede para potenciar tus ventas y administrar tu negocio con facilidad.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nombre de usuario"
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
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    No tienes una cuenta? <Link to="/register" className="text-blue-600 hover:underline">Regístrate</Link>
                  </p>
                </div>
              </form>

              {/* Copyright Footer */}
              <div className="absolute bottom-0 left-0 w-full text-center text-sm text-gray-600 dark:text-gray-400 py-2">
                <p> {currentYear} Super Ventas. Todos los derechos reservados.</p>
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
      
      <ChangePasswordDialog 
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        onPasswordChanged={() => {
          setIsTransitioning(true);
          setTimeout(() => {
            navigate("/");
          }, 1000);
        }}
      />
    </div>
  );
};

export default Login;
