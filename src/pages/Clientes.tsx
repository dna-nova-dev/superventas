import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DataTable, DataTableActions } from '@/components/ui/DataTable';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Users, User, MapPin, Phone, Mail, Search, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Cliente } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAllClientes, createCliente, updateCliente, deleteCliente } from '@/services/clienteService';
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

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

interface ClienteFormData {
  nombre: string;
  apellido: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  email: string;
  direccion: string;
  municipio: string;
  departamento: string;
}

const ClienteCard = ({ cliente, onEdit, onDelete }: {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    transition={{ duration: 0.3 }}
    className="bg-transparent rounded-xl border shadow-sm overflow-hidden transition-all card-hover"
  >
    <div className="relative group">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative bg-card text-card-foreground rounded-xl border shadow-sm p-6 transition-all hover:shadow-md dark:border-gray-800 dark:hover:border-gray-700"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <User className="h-6 w-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{cliente.nombre} {cliente.apellido}</h3>
              <p className="text-sm text-muted-foreground">
                {cliente.tipoDocumento}: {cliente.numeroDocumento}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(cliente);
                }}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(cliente);
                }}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 space-y-2">
          {cliente.direccion !== "N/A" && (
            <div className="flex items-start text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
              <span>
                <span className="text-foreground">{cliente.direccion}</span>
                <div className="text-muted-foreground">
                  {cliente.municipio}, {cliente.departamento}
                </div>
              </span>
            </div>
          )}

          {cliente.telefono !== "N/A" && (
            <div className="flex items-center text-sm text-foreground">
              <Phone className="h-4 w-4 text-muted-foreground mr-2" />
              {cliente.telefono}
            </div>
          )}

          {cliente.email !== "N/A" && (
            <div className="flex items-center text-sm text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground mr-2" />
              {cliente.email}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const AddClienteCard = ({ onAdd }: { onAdd: () => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    transition={{ duration: 0.3 }}
    onClick={onAdd}
    className="bg-transparent p-5 rounded-xl border border-dashed shadow-sm flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
  >
    <div className="p-3 rounded-full bg-primary/10 mb-3">
      <User className="h-6 w-6 text-primary" />
    </div>
    <p className="font-medium">Agregar nuevo cliente</p>
    <p className="text-sm text-muted-foreground">Clic para agregar</p>
  </motion.div>
);

const ClientForm = ({
  formData,
  setFormData,
  handleSubmit,
  isEditing,
  onCancel
}: {
  formData: ClienteFormData;
  setFormData: (data: ClienteFormData) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isEditing: boolean;
  onCancel: () => void;
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipoDocumento">Tipo Documento</Label>
          <Select
            value={formData.tipoDocumento}
            onValueChange={(value) => setFormData({ ...formData, tipoDocumento: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DPI">DPI</SelectItem>
              <SelectItem value="NIT">NIT</SelectItem>
              <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="numeroDocumento">Número Documento</Label>
          <Input
            id="numeroDocumento"
            value={formData.numeroDocumento}
            onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
            required
            pattern={formData.tipoDocumento === 'DPI' ? '[0-9]{13}' : undefined}
            title={formData.tipoDocumento === 'DPI' ? 'El DPI debe tener 13 dígitos' : undefined}
            placeholder={
              formData.tipoDocumento === 'DPI' ? '1234567890123' :
                formData.tipoDocumento === 'NIT' ? '123456-7' :
                  'Ingrese número de documento'
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={formData.direccion}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="municipio">Municipio</Label>
          <Input
            id="municipio"
            value={formData.municipio}
            onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="departamento">Departamento</Label>
          <Input
            id="departamento"
            value={formData.departamento}
            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
          />
        </div>
      </div>

      {isDesktop && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </Button>
        </div>
      )}
    </form>
  );
};

const Clientes = () => {
  const { toast } = useToast();
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const { empresaId } = useAuth();
  const canEditClientes = canEdit('clientes');
  const canDeleteClientes = canDelete('clientes');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: '',
    apellido: '',
    tipoDocumento: 'DPI',
    numeroDocumento: '',
    telefono: '',
    email: '',
    direccion: '',
    municipio: '',
    departamento: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isMobile = useIsMobile();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const data = await getAllClientes();
      const filtered = empresaId ? data.filter((c: Cliente) => c.empresaId === empresaId) : data;
      setClientes(filtered);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      tipoDocumento: 'DPI',
      numeroDocumento: '',
      telefono: '',
      email: '',
      direccion: '',
      municipio: '',
      departamento: ''
    });
    setIsEditing(false);
    setSelectedClienteId(null);
  };

  const handleRowClick = (cliente: Cliente) => {
    toast({
      title: `${cliente.nombre} ${cliente.apellido}`,
      description: `${cliente.tipoDocumento}: ${cliente.numeroDocumento}`,
    });
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      telefono: cliente.telefono === 'N/A' ? '' : cliente.telefono,
      email: cliente.email === 'N/A' ? '' : cliente.email,
      direccion: cliente.direccion === 'N/A' ? '' : cliente.direccion,
      municipio: cliente.municipio === 'N/A' ? '' : cliente.municipio,
      departamento: cliente.departamento === 'N/A' ? '' : cliente.departamento
    });
    setIsEditing(true);
    setSelectedClienteId(cliente.id);
    setShowModal(true);
  };

  const handleDelete = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return;

    try {
      await deleteCliente(clienteToDelete.id);
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente"
      });
      await loadClientes();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setClienteToDelete(null);
    }
  };

  const handleAddCliente = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clienteData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono || "N/A",
        email: formData.email || "N/A",
        direccion: formData.direccion || "N/A",
        municipio: formData.municipio || "N/A",
        departamento: formData.departamento || "N/A",
        empresaId: empresaId
      };

      let success = false;
      if (isEditing && selectedClienteId) {
        const result = await updateCliente(selectedClienteId, clienteData);
        if (result) {
          toast({
            title: "Cliente actualizado",
            description: "El cliente se ha actualizado exitosamente"
          });
          success = true;
        }
      } else {
        const result = await createCliente(clienteData);
        if (result) {
          toast({
            title: "Cliente creado",
            description: "El cliente se ha registrado exitosamente"
          });
          success = true;
        }
      }

      if (success) {
        setShowModal(false);
        resetForm();
        await loadClientes();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing ? "No se pudo actualizar el cliente" : "No se pudo crear el cliente",
        variant: "destructive"
      });
    }
  };

  const filteredClientes = searchQuery
    ? clientes.filter(cliente =>
      `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.numeroDocumento.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : clientes;

  const columns = [
    {
      header: "ID",
      accessor: (cliente: Cliente) => cliente.id.toString(),
      className: "w-[60px]"
    },
    {
      header: "Cliente",
      accessor: (cliente: Cliente) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <div className="font-medium">
              {cliente.nombre} {cliente.apellido}
            </div>
            <div className="text-xs text-muted-foreground">
              {cliente.tipoDocumento}: {cliente.numeroDocumento}
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Ubicación",
      accessor: (cliente: Cliente) => (
        cliente.municipio !== "N/A" ? (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 text-muted-foreground mr-1 mt-0.5" />
            <span>
              {cliente.municipio}, {cliente.departamento}
              <div className="text-xs text-muted-foreground">{cliente.direccion}</div>
            </span>
          </div>
        ) : "No especificada"
      )
    },
    {
      header: "Contacto",
      accessor: (cliente: Cliente) => (
        <div className="space-y-1">
          {cliente.telefono !== "N/A" && (
            <div className="flex items-center text-sm">
              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
              {cliente.telefono}
            </div>
          )}
          {cliente.email !== "N/A" && (
            <div className="flex items-center text-sm">
              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
              {cliente.email}
            </div>
          )}
          {cliente.telefono === "N/A" && cliente.email === "N/A" && "No especificado"}
        </div>
      )
    },
    {
      header: "Documento",
      accessor: (cliente: Cliente) => (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {cliente.tipoDocumento}: {cliente.numeroDocumento}
        </div>
      ),
      className: "w-[180px]"
    }
  ];

  const DeleteConfirmationDialog = () => {
    if (!isMobile) {
      return (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
                {clienteToDelete && ` ${clienteToDelete.nombre} ${clienteToDelete.apellido}`}
                {` y todos sus datos asociados.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Drawer open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>¿Está seguro?</DrawerTitle>
            <DrawerDescription>
              Esta acción no se puede deshacer
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Se eliminará permanentemente el cliente
              {clienteToDelete && ` ${clienteToDelete.nombre} ${clienteToDelete.apellido}`}
              {` y todos sus datos asociados.`}
            </p>
          </div>
          <DrawerFooter>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              className="w-full"
            >
              Eliminar cliente
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <motion.div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="mr-3 h-8 w-8 text-purple-500" />
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Administre los clientes registrados en el sistema.
          </p>
        </motion.div>


        <AnimatePresence mode="popLayout">
          {getViewMode().toString() === 'list' ? (
            <motion.div
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="w-full"
            >
              <DataTable
                data={filteredClientes}
                columns={columns}
                title="Listado de Clientes"
                description="Gestión de clientes del sistema"
                onRowClick={handleRowClick}
                searchKeys={["nombre", "apellido", "numeroDocumento"]}
                searchPlaceholder="Buscar cliente..."
                actions={canEditClientes ? 
                  <DataTableActions 
                    onAdd={handleAddCliente} 
                    addLabel="Nuevo Cliente"
                  /> 
                  : null
                }
                onEdit={canEditClientes ? handleEdit : undefined}
                onDelete={canDeleteClientes ? handleDelete : undefined}
                className="transition-all hover:scale-[1.01]"
              />
            </motion.div>
          ) : (
            <motion.div
              layout="position"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 350,
                damping: 30
              }}
              className="w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                {canEditClientes && (
                  <Button
                    onClick={handleAddCliente}
                    className="ml-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                )}
              </div>
              <motion.div
                layout="position"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 350,
                  damping: 30
                }}
              >
                <AnimatePresence mode="wait">
                  {filteredClientes.map((cliente) => (
                    <motion.div
                      key={cliente.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    >
                      <ClienteCard
                        cliente={cliente}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                  {canEditClientes && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    >
                      <AddClienteCard onAdd={handleAddCliente} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isDesktop ? (
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Cliente' : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Nuevo Cliente</span>
                  </div>
                )}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifique los datos del cliente' : 'Complete los datos del nuevo cliente'}
              </DialogDescription>
            </DialogHeader>
            <ClientForm
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              isEditing={isEditing}
              onCancel={() => setShowModal(false)}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) resetForm();
        }}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {isEditing ? 'Editar Cliente' : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Nuevo Cliente</span>
                  </div>
                )}
              </DrawerTitle>
              <DrawerDescription>
                {isEditing ? 'Modifique los datos del cliente' : 'Complete los datos del nuevo cliente'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <ClientForm
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                isEditing={isEditing}
                onCancel={() => setShowModal(false)}
              />
            </div>
            <DrawerFooter className="pt-2">
              <Button onClick={(e) => handleSubmit(e)} className="w-full">
                {isEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {DeleteConfirmationDialog()}
    </Layout>
  );
};

export default Clientes;
