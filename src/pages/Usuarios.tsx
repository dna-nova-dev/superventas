import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { DataTable, DataTableActions } from '@/components/ui/DataTable';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  User,
  ShieldCheck,
  UserCog,
  Plus,
  Search,
  PenSquare,
  XSquare,
  ClipboardEdit,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { Usuario } from '@/types';
import { Caja } from '@/types/caja.interface';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { usuarioService } from '@/services/usuarioService';
import { getAllCajas, getCajaById } from '@/services/cajaService';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEmpresas } from '@/services/empresaService';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const tableVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const Usuarios = () => {
  const { toast } = useToast();
  const { getViewMode, canEdit, canDelete, userRole } = useRolePermissions();
  const { empresaId } = useAuth();
  const viewMode = getViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [newUser, setNewUser] = useState({
    usuario_nombre: '',
    usuario_apellido: '',
    usuario_usuario: '',
    usuario_email: '',
    usuario_cargo: 'Cajero',
    caja_id: 0,
    usuario_foto: '',
    empresaId: 0
  });
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await usuarioService.getAllUsuarios();
        if (userRole === 'Owner') {
          setUsuarios(users);
          const empresasData = await getAllEmpresas();
          setEmpresas(empresasData);
        } else {
          const filtered = users.filter(u => u.empresaId === empresaId);
          setUsuarios(filtered);
        }
        const allCajas = await getAllCajas();
        const filteredCajas = allCajas.filter(c => c.empresaId === empresaId);
        setCajas(filteredCajas);
        if (userRole === 'Owner') {
          setCajas(allCajas);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar la lista de usuarios",
          variant: "destructive"
        });
      }
    };
    loadUsers();
  }, []);

  const ResponsiveDialogDrawer = ({ open, onOpenChange, children }) => {
    if (isDesktop) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[500px]">
            {children}
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          {children}
          <DrawerFooter>
            <Button
              onClick={handleSaveUser}
              className="w-full"
            >
              {isEditing ? (
                <>
                  Actualizar Usuario
                </>
              ) : (
                <>
                  Crear Usuario
                </>
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const handleRowClick = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setShowUserDetails(true);
  };

  const handleCloseDialog = () => {
    setShowUserDetails(false);
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setIsEditing(true);
    setNewUser({
      usuario_nombre: usuario.usuario_nombre,
      usuario_apellido: usuario.usuario_apellido,
      usuario_usuario: usuario.usuario_usuario,
      usuario_email: usuario.usuario_email,
      usuario_cargo: usuario.usuario_cargo,
      caja_id: usuario.caja_id,
      usuario_foto: usuario.usuario_foto,
      empresaId: usuario.empresaId
    });
  };

  const handleDelete = (usuario: Usuario) => {
    setUserToDelete(usuario);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await usuarioService.deleteUsuario(userToDelete.usuario_id);
        setUsuarios(prev => prev.filter(u => u.usuario_id !== userToDelete.usuario_id));
        toast({
          title: "Usuario desactivado",
          description: `Se ha desactivado ${userToDelete.usuario_nombre} ${userToDelete.usuario_apellido}`,
          variant: "default"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo desactivar el usuario",
          variant: "destructive"
        });
      } finally {
        setShowDeleteAlert(false);
        setUserToDelete(null);
      }
    }
  };

  const handleAddUsuario = () => {
    setIsCreating(true);
  };

  const handleSaveUser = async () => {
    try {
      if (isEditing && editingUser) {
        const updatedUser = await usuarioService.updateUsuario(editingUser.usuario_id, newUser);
        setUsuarios(prev => prev.map(user =>
          user.usuario_id === editingUser.usuario_id ? updatedUser : user
        ));
        toast({
          title: "Usuario actualizado",
          description: `Se ha actualizado ${newUser.usuario_nombre} en el sistema.`
        });
      } else {
        const userToAdd = await usuarioService.createUsuario({
          ...newUser,
          usuario_clave: '123456',
          empresaId: userRole === 'Owner' ? newUser.empresaId : empresaId
        });
        setUsuarios(prev => [...prev, userToAdd]);
        toast({
          title: "Usuario agregado",
          description: `Se ha agregado ${newUser.usuario_nombre} al sistema.`
        });
      }
      setIsCreating(false);
      setIsEditing(false);
      setEditingUser(null);
      setNewUser({
        usuario_nombre: '',
        usuario_apellido: '',
        usuario_usuario: '',
        usuario_email: '',
        usuario_cargo: 'Cajero',
        caja_id: 0,
        usuario_foto: '',
        empresaId: 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar los cambios del usuario",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'superventas');
    formData.append('timestamp', String(Date.now() / 1000));

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/daizfqpru/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      setNewUser(prev => ({
        ...prev,
        usuario_foto: data.secure_url
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo subir la imagen",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const handleResetPassword = (userId: number) => {
    if (window.confirm('¿Está seguro de restablecer la contraseña?')) {
      const updatedUser = usuarioService.updateUsuario(userId, {
        usuario_clave: '123456'
      });
      if (updatedUser) {
        toast({
          title: "Contraseña restablecida",
          description: "La nueva contraseña es: 123456",
        });
        setIsResettingPassword(false);
      }
    }
  };

  const columns = [
    {
      header: "ID",
      accessor: (usuario: Usuario) => usuario.usuario_id.toString(),
      className: "w-[60px]"
    },
    {
      header: "Usuario",
      accessor: (usuario: Usuario) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {usuario.usuario_foto ? (
              <img src={usuario.usuario_foto} alt={usuario.usuario_nombre} className="w-full h-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <div className="font-medium">
              {usuario.usuario_nombre} {usuario.usuario_apellido}
            </div>
            <div className="text-xs text-muted-foreground">
              {usuario.usuario_email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Nombre de Usuario",
      accessor: (usuario: Usuario) => usuario.usuario_usuario
    },
    {
      header: "Cargo",
      accessor: (usuario: Usuario) => (
        <div className="flex items-center">
          {usuario.usuario_cargo === "Administrador" ? (
            <div className="flex items-center text-blue-500">
              <ShieldCheck className="h-4 w-4 mr-1" />
              <span>{usuario.usuario_cargo}</span>
            </div>
          ) : (
            <div className="flex items-center text-green-500">
              <UserCog className="h-4 w-4 mr-1" />
              <span>{usuario.usuario_cargo}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: "Caja Asignada",
      accessor: (usuario: Usuario) => {
        const caja = cajas.find(c => c.id === usuario.caja_id);
        return caja ? caja.nombre : 'No asignada';
      }
    }
  ];

  const filteredUsuarios = searchQuery
    ? usuarios.filter(usuario =>
      `${usuario.usuario_nombre} ${usuario.usuario_apellido}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.usuario_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.usuario_usuario.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : usuarios;

  const statsData = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.usuario_cargo === "Administrador").length,
    others: usuarios.filter(u => u.usuario_cargo !== "Administrador").length
  };

  const DeleteConfirmationDialog = () => {
    if (!isMobile) {
      return (
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de desactivar este usuario?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción desactivará al usuario {userToDelete?.usuario_nombre} {userToDelete?.usuario_apellido}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Desactivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Drawer open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>¿Está seguro?</DrawerTitle>
            <DrawerDescription>
              Esta acción desactivará al usuario
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Se desactivará al usuario
              {userToDelete && ` ${userToDelete.usuario_nombre} ${userToDelete.usuario_apellido}`}.
              El usuario no podrá acceder al sistema hasta que sea reactivado.
            </p>
          </div>
          <DrawerFooter>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              className="w-full"
            >
              Desactivar usuario
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const UserDetailsDialog = () => {
    if (isDesktop) {
      return (
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl">Detalles del Usuario</DialogTitle>
              <DialogDescription>
                Información completa del usuario
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="flex justify-center mb-2">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {selectedUser.usuario_foto ? (
                      <img src={selectedUser.usuario_foto} alt={selectedUser.usuario_nombre} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-primary" />
                    )}
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-bold text-xl">{selectedUser.usuario_nombre} {selectedUser.usuario_apellido}</h3>
                  <div className={`inline-flex items-center mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                    selectedUser.usuario_cargo === "Administrador"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {selectedUser.usuario_cargo}
                  </div>
                  <button
                    onClick={handleCloseDialog}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-secondary text-secondary-foreground shadow hover:bg-secondary/80 mt-4"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detalles del Usuario</DrawerTitle>
            <DrawerDescription>
              Información completa del usuario
            </DrawerDescription>
          </DrawerHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {selectedUser.usuario_foto ? (
                    <img src={selectedUser.usuario_foto} alt={selectedUser.usuario_nombre} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}
                </div>
              </div>

              <div className="text-center mb-4">
                <h3 className="font-bold text-xl">{selectedUser.usuario_nombre} {selectedUser.usuario_apellido}</h3>
                <div className={`inline-flex items-center mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                  selectedUser.usuario_cargo === "Administrador"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {selectedUser.usuario_cargo}
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            <DrawerClose asChild>
              <Button 
                className="w-full"
              >
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const UserFormDialog = () => {
    if (isDesktop) {
      return (
        <Dialog open={isCreating || isEditing} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setIsEditing(false);
            setEditingUser(null);
            setNewUser({
              usuario_nombre: '',
              usuario_apellido: '',
              usuario_usuario: '',
              usuario_email: '',
              usuario_cargo: 'Cajero',
              caja_id: 0,
              usuario_foto: '',
              empresaId: 0
            });
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifique los datos del usuario' : 'Complete los datos del nuevo usuario'}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="personal" className="flex-1">
                  <User className="h-4 w-4 mr-2" />
                  Datos Personales
                </TabsTrigger>
                <TabsTrigger value="account" className="flex-1">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Cuenta
                </TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="personal" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    {/* Foto de perfil */}
                    <div className="space-y-2">
                      <Label htmlFor="foto" className="text-center block">Foto de perfil</Label>
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {newUser.usuario_foto ? (
                            <img src={newUser.usuario_foto} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-12 w-12 text-primary" />
                          )}
                        </div>
                        <div className="w-full">
                          <Input
                            id="foto"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                            className="w-full"
                          />
                          {uploading && (
                            <p className="text-sm text-muted-foreground mt-1 text-center">
                              Subiendo imagen...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nombre y Apellido */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={newUser.usuario_nombre}
                          onChange={e => setNewUser({ ...newUser, usuario_nombre: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input
                          id="apellido"
                          value={newUser.usuario_apellido}
                          onChange={e => setNewUser({ ...newUser, usuario_apellido: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.usuario_email}
                        onChange={e => setNewUser({ ...newUser, usuario_email: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="account" className="space-y-4 mt-0">
                  {/* Usuario */}
                  <div className="space-y-2">
                    <Label htmlFor="usuario">Nombre de usuario</Label>
                    <Input
                      id="usuario"
                      value={newUser.usuario_usuario}
                      onChange={e => setNewUser({ ...newUser, usuario_usuario: e.target.value })}
                    />
                  </div>

                  {/* Cargo */}
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Select
                      value={newUser.usuario_cargo}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, usuario_cargo: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cajero">Cajero</SelectItem>
                        <SelectItem value="Encargado">Encargado</SelectItem>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {userRole === 'Owner' && (
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Select
                        value={newUser.empresaId ? String(newUser.empresaId) : ''}
                        onValueChange={(value) =>
                          setNewUser({ ...newUser, empresaId: parseInt(value) || 0 })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione una empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {empresas.map((empresa) => (
                            <SelectItem key={empresa.id} value={String(empresa.id)}>
                              {empresa.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Caja */}
                  <div className="space-y-2">
                    <Label htmlFor="caja">Caja asignada</Label>
                    <Select
                      value={newUser.caja_id ? String(newUser.caja_id) : ''}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, caja_id: parseInt(value) || 0 })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {cajas.map((caja) => (
                          <SelectItem key={caja.id} value={String(caja.id)}>
                            {caja.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <KeyRound className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {isEditing ? 'Contraseña actual del usuario' : 'Se generará contraseña: 123456'}
                          </span>
                        </div>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleResetPassword(editingUser?.usuario_id || 0)}
                            disabled={isResettingPassword}
                            className="inline-flex items-center space-x-1 text-sm text-blue-500 hover:text-blue-700"
                          >
                            <RefreshCw className={`h-4 w-4 ${isResettingPassword ? 'animate-spin' : ''}`} />
                            <span>Restablecer</span>
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {isEditing
                          ? 'Puede restablecer la contraseña del usuario si es necesario.'
                          : 'El usuario podrá cambiar su contraseña al iniciar sesión.'}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <div className="p-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
                setEditingUser(null);
                setNewUser({
                  usuario_nombre: '',
                  usuario_apellido: '',
                  usuario_usuario: '',
                  usuario_email: '',
                  usuario_cargo: 'Cajero',
                  caja_id: 0,
                  usuario_foto: '',
                  empresaId: 0
                });
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser}>
                {isEditing ? (
                  <>
                    <ClipboardEdit className="mr-2 h-4 w-4" />
                    Actualizar Usuario
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={isCreating || isEditing} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setIsEditing(false);
          setEditingUser(null);
          setNewUser({
            usuario_nombre: '',
            usuario_apellido: '',
            usuario_usuario: '',
            usuario_email: '',
            usuario_cargo: 'Cajero',
            caja_id: 0,
            usuario_foto: '',
            empresaId: 0
          });
        }
      }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DrawerTitle>
            <DrawerDescription>
              {isEditing ? 'Modifique los datos del usuario' : 'Complete los datos del nuevo usuario'}
            </DrawerDescription>
          </DrawerHeader>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="personal" className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Datos Personales
              </TabsTrigger>
              <TabsTrigger value="account" className="flex-1">
                <KeyRound className="h-4 w-4 mr-2" />
                Cuenta
              </TabsTrigger>
            </TabsList>

            <div className="p-4">
              <TabsContent value="personal" className="space-y-4 mt-0">
                <div className="space-y-4">
                  {/* Foto de perfil */}
                  <div className="space-y-2">
                    <Label htmlFor="foto" className="text-center block">Foto de perfil</Label>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {newUser.usuario_foto ? (
                          <img src={newUser.usuario_foto} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-primary" />
                        )}
                      </div>
                      <div className="w-full">
                        <Input
                          id="foto"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="w-full"
                        />
                        {uploading && (
                          <p className="text-sm text-muted-foreground mt-1 text-center">
                            Subiendo imagen...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nombre y Apellido */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={newUser.usuario_nombre}
                        onChange={e => setNewUser({ ...newUser, usuario_nombre: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        value={newUser.usuario_apellido}
                        onChange={e => setNewUser({ ...newUser, usuario_apellido: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.usuario_email}
                      onChange={e => setNewUser({ ...newUser, usuario_email: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4 mt-0">
                {/* Usuario */}
                <div className="space-y-2">
                  <Label htmlFor="usuario">Nombre de usuario</Label>
                  <Input
                    id="usuario"
                    value={newUser.usuario_usuario}
                    onChange={e => setNewUser({ ...newUser, usuario_usuario: e.target.value })}
                  />
                </div>

                {/* Cargo */}
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Select
                    value={newUser.usuario_cargo}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, usuario_cargo: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccione un cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cajero">Cajero</SelectItem>
                      <SelectItem value="Encargado">Encargado</SelectItem>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userRole === 'Owner' && (
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Select
                      value={newUser.empresaId ? String(newUser.empresaId) : ''}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, empresaId: parseInt(value) || 0 })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione una empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.empresa_id} value={String(empresa.empresa_id)}>
                            {empresa.empresa_nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Caja */}
                <div className="space-y-2">
                  <Label htmlFor="caja">Caja asignada</Label>
                  <Select
                    value={newUser.caja_id ? String(newUser.caja_id) : ''}
                    onValueChange={(value) =>
                      setNewUser({ ...newUser, caja_id: parseInt(value) || 0 })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {cajas.map((caja) => (
                        <SelectItem key={caja.id} value={String(caja.id)}>
                          {caja.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {isEditing ? 'Contraseña actual del usuario' : 'Se generará contraseña: 123456'}
                        </span>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleResetPassword(editingUser?.usuario_id || 0)}
                          disabled={isResettingPassword}
                          className="inline-flex items-center space-x-1 text-sm text-blue-500 hover:text-blue-700"
                        >
                          <RefreshCw className={`h-4 w-4 ${isResettingPassword ? 'animate-spin' : ''}`} />
                          <span>Restablecer</span>
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {isEditing
                        ? 'Puede restablecer la contraseña del usuario si es necesario.'
                        : 'El usuario podrá cambiar su contraseña al iniciar sesión.'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DrawerFooter>
            <Button
              onClick={handleSaveUser}
              className="w-full"
            >
              {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <Layout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="mr-3 h-8 w-8 text-green-500" />
            Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administre los usuarios del sistema.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="bg-transparent rounded-xl border shadow-sm p-5 transition-all card-hover">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-7 w-7 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{statsData.total}</h3>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-transparent rounded-xl border shadow-sm p-5 transition-all card-hover">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{statsData.admins}</h3>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-transparent rounded-xl border shadow-sm p-5 transition-all card-hover">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center">
                <UserCog className="h-7 w-7 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{statsData.others}</h3>
                <p className="text-sm text-muted-foreground">Otros Usuarios</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {viewMode === 'cards' && (
          <motion.div variants={itemVariants}>
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {canEdit() && (
                <button
                  onClick={handleAddUsuario}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </button>
              )}
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={containerVariants}
            >
              {filteredUsuarios.map(usuario => {
                const caja = cajas.find(c => c.id === usuario.caja_id);
                return (
                  <motion.div
                    key={usuario.usuario_id}
                    variants={itemVariants}
                    className="bg-transparent rounded-xl border shadow-sm overflow-hidden transition-all card-hover"
                    onClick={() => handleRowClick(usuario)}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {usuario.usuario_foto ? (
                            <img src={usuario.usuario_foto} alt={usuario.usuario_nombre} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${usuario.usuario_cargo === "Administrador"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                          }`}>
                          {usuario.usuario_cargo}
                        </div>
                      </div>

                      <h3 className="font-medium text-lg mt-3">
                        {usuario.usuario_nombre} {usuario.usuario_apellido}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {usuario.usuario_usuario}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {usuario.usuario_email}
                      </p>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Caja asignada:</span>
                          <span className="font-medium">{caja?.nombre || 'No asignada'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 px-5 py-3 flex justify-end space-x-2">
                      {canEdit() && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="p-2 rounded-md hover:bg-blue-50 text-blue-500 border border-blue-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(usuario);
                                }}
                              >
                                <PenSquare className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar usuario</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {canDelete() && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="p-2 rounded-md hover:bg-red-50 text-red-500 border border-red-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(usuario);
                                }}
                              >
                                <XSquare className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Desactivar usuario</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {canEdit() && (
                <motion.div
                  variants={itemVariants}
                  onClick={handleAddUsuario}
                  className="bg-transparent p-5 rounded-xl border border-dashed shadow-sm flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">Agregar nuevo usuario</p>
                  <p className="text-sm text-muted-foreground">Clic para agregar</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div
            variants={tableVariants}
            initial="hidden"
            animate="show"
          >
            <DataTable
              data={filteredUsuarios}
              columns={columns}
              title="Listado de Usuarios"
              description="Usuarios con acceso al sistema"
              onRowClick={handleRowClick}
              searchKeys={["usuario_nombre", "usuario_apellido", "usuario_email", "usuario_usuario"]}
              searchPlaceholder="Buscar usuario..."
              actions={canEdit() && (
                <Button onClick={handleAddUsuario}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              )}
              onEdit={canEdit() ? handleEdit : undefined}
              onDelete={canDelete() ? handleDelete : undefined}
              className="transition-all hover:scale-[1.01]"
            />
          </motion.div>
        )}
      </motion.div>
      {UserFormDialog()}
      {UserDetailsDialog()}
      {DeleteConfirmationDialog()}
    </Layout>
  );
};

export default Usuarios;
