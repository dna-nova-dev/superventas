import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { usuarioService } from "@/services/usuarioService";
import { createEmpresa, getEmpresaByUsuarioId } from "@/services/empresaService";

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Datos del administrador
    nombre: "",
    apellido: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    
    // Paso 2: Datos de la empresa
    nombreEmpresa: "",
    nit: "",
    direccion: "",
    telefonoEmpresa: "",
    emailEmpresa: "",
  });

  const isStep1Complete = () => {
    const { nombre, apellido, email, username, password, confirmPassword, telefono } = formData;
    return (
      nombre.trim() !== '' &&
      apellido.trim() !== '' &&
      email.trim() !== '' &&
      username.trim() !== '' &&
      password !== '' &&
      confirmPassword !== '' &&
      telefono.trim() !== '' &&
      password === confirmPassword &&
      password.length >= 8 &&
      termsAccepted
    );
  };

  const isStep2Complete = () => {
    const { nombreEmpresa, nit, direccion, telefonoEmpresa, emailEmpresa } = formData;
    return (
      nombreEmpresa.trim() !== '' &&
      nit.trim() !== '' &&
      direccion.trim() !== '' &&
      telefonoEmpresa.trim() !== '' &&
      emailEmpresa.trim() !== ''
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
    const { nombre, apellido, email, username, password, confirmPassword, telefono } = formData;
    
    if (!nombre || !apellido || !email || !username || !password || !confirmPassword || !telefono) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Todos los campos son obligatorios",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Las contraseñas no coinciden",
      });
      return false;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La contraseña debe tener al menos 8 caracteres",
      });
      return false;
    }

    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debes aceptar los términos y condiciones",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const { nombreEmpresa, nit, direccion, telefonoEmpresa, emailEmpresa } = formData;
    
    if (!nombreEmpresa || !nit || !direccion || !telefonoEmpresa || !emailEmpresa) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Todos los campos son obligatorios",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      handleNextStep();
      return;
    }

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      // Validar que no haya campos vacíos
      const requiredFields = [
        { field: formData.nombre.trim(), name: 'Nombre' },
        { field: formData.apellido.trim(), name: 'Apellido' },
        { field: formData.email.trim(), name: 'Email' },
        { field: formData.username.trim(), name: 'Nombre de usuario' },
        { field: formData.password, name: 'Contraseña' },
        { field: formData.nombreEmpresa.trim(), name: 'Nombre de la empresa' },
        { field: formData.direccion.trim(), name: 'Dirección de la empresa' },
        { field: formData.telefonoEmpresa.trim(), name: 'Teléfono de la empresa' },
        { field: formData.emailEmpresa.trim(), name: 'Email de la empresa' },
        { field: formData.nit.trim(), name: 'NIT de la empresa' }
      ];
      
      const emptyFields = requiredFields.filter(field => !field.field);
      if (emptyFields.length > 0) {
        throw new Error(`Los siguientes campos son obligatorios: ${emptyFields.map(f => f.name).join(', ')}`);
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error('El formato del correo electrónico no es válido');
      }
      
      if (!emailRegex.test(formData.emailEmpresa.trim())) {
        throw new Error('El formato del correo electrónico de la empresa no es válido');
      }
      
      // Validar longitud mínima de la contraseña
      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      try {
        // 1. Preparar los datos del registro con la empresa incluida
        // Por defecto, el primer usuario será Owner
        const registrationData = {
          // Datos del usuario
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          usuario: formData.username.trim(),
          clave: formData.password,
          cargo: "Owner", // Siempre asignamos Owner en el registro inicial
          // No incluimos hasChangedPassword ya que el backend lo maneja
          
          // Datos de la empresa anidados
          empresa: {
            nombre: formData.nombreEmpresa.trim(),
            nit: formData.nit.trim(),
            telefono: formData.telefonoEmpresa.trim(),
            email: formData.emailEmpresa.trim(),
            direccion: formData.direccion.trim()
          }
        };
        
        // Enviar todos los datos en una sola solicitud
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
          let errorMessage = 'Error al registrar';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
          } catch (e) {
            errorMessage = `HTTP ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();

        // Verificar si hay un token en la respuesta
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta y empresa han sido creadas correctamente. Por favor inicia sesión.",
        });

        // Redirigir al login
        navigate("/login");
      } catch (error: unknown) {
        console.error("Error en el registro:", error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Ocurrió un error al registrar la cuenta";
        
        toast({
          variant: "destructive",
          title: "Error en el registro",
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }

      // Mostrar mensaje de éxito
      toast({
        title: "¡Registro exitoso!",
        description: `Tu cuenta y empresa han sido creadas correctamente. Por favor inicia sesión.`,
      });

      // Redirigir al login
      navigate("/login");
    } catch (error: unknown) {
      console.error("Error en el registro:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Ocurrió un error al registrar la cuenta";
      
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-900">
      <div className="flex flex-col justify-center w-full max-w-md p-8 space-y-6 shadow-lg rounded-lg relative mx-auto my-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">Super Ventas</h1>
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
              Beta <span className="opacity-60">v1.0</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-300"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Welcome Message */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crea tu cuenta</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {step === 1 
              ? "Paso 1: Información del administrador" 
              : "Paso 2: Información de la empresa"}
          </p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={handleChange}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Nombre de usuario"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+57 123 456 7890"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Acepto los términos y condiciones
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombreEmpresa">Nombre de la Empresa</Label>
                  <Input
                    id="nombreEmpresa"
                    name="nombreEmpresa"
                    type="text"
                    required
                    value={formData.nombreEmpresa}
                    onChange={handleChange}
                    placeholder="Nombre de la empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="nit">NIT</Label>
                  <Input
                    id="nit"
                    name="nit"
                    type="text"
                    required
                    value={formData.nit}
                    onChange={handleChange}
                    placeholder="Número de identificación tributaria"
                  />
                </div>

                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    type="text"
                    required
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Dirección de la empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="telefonoEmpresa">Teléfono de la empresa</Label>
                  <Input
                    id="telefonoEmpresa"
                    name="telefonoEmpresa"
                    type="tel"
                    required
                    value={formData.telefonoEmpresa}
                    onChange={handleChange}
                    placeholder="+57 123 456 7890"
                  />
                </div>

                <div>
                  <Label htmlFor="emailEmpresa">Correo electrónico de la empresa</Label>
                  <Input
                    id="emailEmpresa"
                    name="emailEmpresa"
                    type="email"
                    required
                    value={formData.emailEmpresa}
                    onChange={handleChange}
                    placeholder="empresa@email.com"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {step === 1 ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleNextStep}
                  disabled={!isStep1Complete() || loading}
                >
                  {loading ? 'Cargando...' : (
                    <>
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !isStep2Complete()}
                  >
                    {loading ? 'Creando cuenta...' : 'Finalizar registro'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="w-full"
                    disabled={loading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                </>
              )}
            </div>
          </form>

          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
          
          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} SuperVentas. Todos los derechos reservados.
          </p>
        </div>
      </div>
  );
};

export default Register;