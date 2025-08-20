
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getImageSrc } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { usuarioService } from '@/services/usuarioService'; // Import usuarioService
import { 
  Shield, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  Save, 
  Lock
} from 'lucide-react';

export const Perfil = () => {
  const { currentUser, userRole } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');

  // Profile form state - initialize from localStorage or currentUser
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('formData');
    try {
      if (savedData) {
        return JSON.parse(savedData);
      } else {
        return {
          nombre: currentUser?.nombre || '', // Use nombre
          apellido: currentUser?.apellido || '', // Use apellido
          email: currentUser?.email || '', // Use email
          cargo: currentUser?.cargo || '' // Use cargo
        };
      }
    } catch (error) {
      console.error("Error parsing formData from localStorage:", error);
      return {
        nombre: currentUser?.nombre || '', // Use nombre
        apellido: currentUser?.apellido || '', // Use apellido
        email: currentUser?.email || '', // Use email
        cargo: currentUser?.cargo || '' // Use cargo
      };
    }
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedFormData = { ...prev, [name]: value };
      localStorage.setItem('formData', JSON.stringify(updatedFormData));
      return updatedFormData;
    });
  };

  useEffect(() => {
    setFormData(prev => ({
      nombre: currentUser?.nombre || '',
      apellido: currentUser?.apellido || '',
      email: currentUser?.email || '',
      cargo: currentUser?.cargo || ''
    }));
  }, [currentUser]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would make an API call to update the user's profile
    // For now, we'll just show a success toast
    toast({
      title: "Perfil actualizado",
      description: "Los datos de tu perfil han sido actualizados correctamente.",
    });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call the updatePassword function from usuarioService
      await usuarioService.updatePassword(
        currentUser.id, // User ID
        passwordData.currentPassword, // Current password
        passwordData.newPassword // New password
      );

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      });

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la contraseña.",
        variant: "destructive"
      });
    }
  };

  if (!currentUser) return <div>Cargando perfil...</div>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Updated avatar logic: Use initials from 'nombre' */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden">
            <span>{currentUser.nombre?.charAt(0) || 'A'}</span>
          </div>
          <div>
             {/* Updated name and ID display */}
            <h1 className="text-2xl md:text-3xl font-bold">{currentUser.nombre} {currentUser.apellido}</h1>
            <div className="flex items-center mt-2">
              <div className="flex items-center text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                <Shield className="w-4 h-4 mr-1" />
                <span>{userRole}</span>
              </div>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-muted-foreground text-sm">ID: {currentUser.id}</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información Personal</TabsTrigger>
            <TabsTrigger value="password">Cambiar Contraseña</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tu información personal. Esta información será visible para otros usuarios del sistema.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="flex items-center gap-1">
                        <User className="h-4 w-4" /> Nombre
                      </Label>
                      <Input 
                        id="nombre" 
                        name="nombre" 
                        value={formData.nombre} 
                        onChange={handleInputChange} 
                        placeholder="Ingresa tu nombre"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apellido" className="flex items-center gap-1">
                        <User className="h-4 w-4" /> Apellido
                      </Label>
                      <Input 
                        id="apellido" 
                        name="apellido" 
                        value={formData.apellido} 
                        onChange={handleInputChange} 
                        placeholder="Ingresa tu apellido"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="h-4 w-4" /> Correo Electrónico
                    </Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="Ingresa tu correo electrónico"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo" className="flex items-center gap-1">
                      <Building className="h-4 w-4" /> Cargo
                    </Label>
                    <Input 
                      id="cargo" 
                      name="cargo" 
                      value={formData.cargo} 
                      onChange={handleInputChange} 
                      placeholder="Tu cargo en la empresa"
                      readOnly
                    />
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit" className="ml-auto">
                    <Save className="h-4 w-4 mr-2" /> Guardar Cambios
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-4">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener segura tu cuenta.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordUpdate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="flex items-center gap-1">
                      <Lock className="h-4 w-4" /> Contraseña Actual
                    </Label>
                    <Input 
                      id="currentPassword" 
                      name="currentPassword" 
                      type="password" 
                      value={passwordData.currentPassword} 
                      onChange={handlePasswordChange} 
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="flex items-center gap-1">
                      <Lock className="h-4 w-4" /> Nueva Contraseña
                    </Label>
                    <Input 
                      id="newPassword" 
                      name="newPassword" 
                      type="password" 
                      value={passwordData.newPassword} 
                      onChange={handlePasswordChange} 
                      placeholder="Ingresa tu nueva contraseña"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                      <Lock className="h-4 w-4" /> Confirmar Contraseña
                    </Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      value={passwordData.confirmPassword} 
                      onChange={handlePasswordChange} 
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>
                </CardContent>

                <CardFooter>
                  <Button type="submit" className="ml-auto">
                    <Save className="h-4 w-4 mr-2" /> Actualizar Contraseña
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Perfil;
