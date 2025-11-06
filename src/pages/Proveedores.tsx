import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { DataTable, DataTableActions } from "@/components/ui/DataTable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  User,
  MapPin,
  Phone,
  Mail,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Proveedor } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getAllProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from "@/services/proveedorService";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const tableVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // Using cubic-bezier values instead of string
    },
  },
};

interface ProveedorFormData {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  email: string;
  direccion: string;
  municipio: string;
  departamento: string;
}

const ProveedorCard = ({
  proveedor,
  onEdit,
  onDelete,
}: {
  proveedor: Proveedor;
  onEdit: (proveedor: Proveedor) => void;
  onDelete: (proveedor: Proveedor) => void;
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
              <h3 className="font-medium text-foreground">
                {proveedor.nombre}
              </h3>
              <p className="text-sm text-muted-foreground">
                {proveedor.tipoDocumento}: {proveedor.numeroDocumento}
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
                  onEdit(proveedor);
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
                  onDelete(proveedor);
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
          {proveedor.direccion !== "N/A" && (
            <div className="flex items-start text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
              <span>
                <span className="text-foreground">{proveedor.direccion}</span>
                <div className="text-muted-foreground">
                  {proveedor.municipio}, {proveedor.departamento}
                </div>
              </span>
            </div>
          )}

          {proveedor.telefono !== "N/A" && (
            <div className="flex items-center text-sm text-foreground">
              <Phone className="h-4 w-4 text-muted-foreground mr-2" />
              {proveedor.telefono}
            </div>
          )}

          {proveedor.email !== "N/A" && (
            <div className="flex items-center text-sm text-foreground">
              <Mail className="h-4 w-4 text-muted-foreground mr-2" />
              {proveedor.email}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  </motion.div>
);

const AddProveedorCard = ({ onAdd }: { onAdd: () => void }) => (
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
    <p className="font-medium">Agregar nuevo proveedor</p>
    <p className="text-sm text-muted-foreground">Clic para agregar</p>
  </motion.div>
);

const ProveedorForm = ({
  formData,
  setFormData,
  handleSubmit,
  isEditing,
  onCancel,
}: {
  formData: ProveedorFormData;
  setFormData: (data: ProveedorFormData) => void;
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
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipoDocumento">Tipo Documento</Label>
          <Select
            value={formData.tipoDocumento}
            onValueChange={(value) =>
              setFormData({ ...formData, tipoDocumento: value })
            }
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
            onChange={(e) =>
              setFormData({ ...formData, numeroDocumento: e.target.value })
            }
            required
            pattern={formData.tipoDocumento === "DPI" ? "[0-9]{13}" : undefined}
            title={
              formData.tipoDocumento === "DPI"
                ? "El DPI debe tener 13 dígitos"
                : undefined
            }
            placeholder={
              formData.tipoDocumento === "DPI"
                ? "1234567890123"
                : formData.tipoDocumento === "NIT"
                ? "123456-7"
                : "Ingrese número de documento"
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
          onChange={(e) =>
            setFormData({ ...formData, telefono: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={formData.direccion}
          onChange={(e) =>
            setFormData({ ...formData, direccion: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="municipio">Municipio</Label>
          <Input
            id="municipio"
            value={formData.municipio}
            onChange={(e) =>
              setFormData({ ...formData, municipio: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="departamento">Departamento</Label>
          <Input
            id="departamento"
            value={formData.departamento}
            onChange={(e) =>
              setFormData({ ...formData, departamento: e.target.value })
            }
          />
        </div>
      </div>

      {isDesktop && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {isEditing ? "Actualizar Proveedor" : "Guardar Proveedor"}
          </Button>
        </div>
      )}
    </form>
  );
};

const Proveedores = () => {
  const { toast } = useToast();
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const { empresaId } = useAuth();
  const canEditProveedores = canEdit("proveedores");
  const canDeleteProveedores = canDelete("proveedores");
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: "",
    tipoDocumento: "DPI",
    numeroDocumento: "",
    telefono: "",
    email: "",
    direccion: "",
    municipio: "",
    departamento: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<Proveedor | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isMobile = useIsMobile();

  const loadProveedores = useCallback(async () => {
    try {
      const data = await getAllProveedores();
      const filtered = empresaId
        ? data.filter((p: Proveedor) => p.empresaId === empresaId)
        : data;
      setProveedores(filtered);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      });
    }
  }, [empresaId, toast]);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipoDocumento: "DPI",
      numeroDocumento: "",
      telefono: "",
      email: "",
      direccion: "",
      municipio: "",
      departamento: "",
    });
    setIsEditing(false);
    setSelectedProveedorId(null);
  };

  const handleRowClick = (proveedor: Proveedor) => {
    toast({
      title: `${proveedor.nombre}`,
      description: `${proveedor.tipoDocumento}: ${proveedor.numeroDocumento}`,
    });
  };

  const handleEdit = (proveedor: Proveedor) => {
    setFormData({
      nombre: proveedor.nombre,
      tipoDocumento: proveedor.tipoDocumento,
      numeroDocumento: proveedor.numeroDocumento,
      telefono: proveedor.telefono === "N/A" ? "" : proveedor.telefono,
      email: proveedor.email === "N/A" ? "" : proveedor.email,
      direccion: proveedor.direccion === "N/A" ? "" : proveedor.direccion,
      municipio: proveedor.municipio === "N/A" ? "" : proveedor.municipio,
      departamento:
        proveedor.departamento === "N/A" ? "" : proveedor.departamento,
    });
    setIsEditing(true);
    setSelectedProveedorId(proveedor.id);
    setShowModal(true);
  };

  const handleDelete = (proveedor: Proveedor) => {
    setProveedorToDelete(proveedor);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!proveedorToDelete) return;

    try {
      await deleteProveedor(proveedorToDelete.id);
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor ha sido eliminado exitosamente",
      });
      await loadProveedores();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el proveedor",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setProveedorToDelete(null);
    }
  };

  const handleAddProveedor = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const proveedorData = {
        nombre: formData.nombre,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        telefono: formData.telefono || "N/A",
        email: formData.email || "N/A",
        direccion: formData.direccion || "N/A",
        municipio: formData.municipio || "N/A",
        departamento: formData.departamento || "N/A",
        empresaId: empresaId,
      };

      let success = false;
      if (isEditing && selectedProveedorId) {
        const result = await updateProveedor(
          selectedProveedorId,
          proveedorData
        );
        if (result) {
          toast({
            title: "Proveedor actualizado",
            description: "El proveedor se ha actualizado exitosamente",
          });
          success = true;
        }
      } else {
        const result = await createProveedor(proveedorData);
        if (result) {
          toast({
            title: "Proveedor creado",
            description: "El proveedor se ha registrado exitosamente",
          });
          success = true;
        }
      }

      if (success) {
        setShowModal(false);
        resetForm();
        await loadProveedores();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isEditing
          ? "No se pudo actualizar el proveedor"
          : "No se pudo crear el proveedor",
        variant: "destructive",
      });
    }
  };

  const filteredProveedores = searchQuery
    ? proveedores.filter(
        (proveedor) =>
          `${proveedor.nombre}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          proveedor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proveedor.numeroDocumento
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : proveedores;

  const columns = [
    {
      header: "ID",
      accessor: (proovedor: Proveedor) => proovedor.id.toString(),
      className: "w-[60px]",
    },
    {
      header: "Proveedor",
      accessor: (proveedor: Proveedor) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <div className="font-medium">{proveedor.nombre}</div>
            <div className="text-xs text-muted-foreground">
              {proveedor.tipoDocumento}: {proveedor.numeroDocumento}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Ubicación",
      accessor: (proveedor: Proveedor) =>
        proveedor.municipio !== "N/A" ? (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 text-muted-foreground mr-1 mt-0.5" />
            <span>
              {proveedor.municipio}, {proveedor.departamento}
              <div className="text-xs text-muted-foreground">
                {proveedor.direccion}
              </div>
            </span>
          </div>
        ) : (
          "No especificada"
        ),
    },
    {
      header: "Contacto",
      accessor: (proveedor: Proveedor) => (
        <div className="space-y-1">
          {proveedor.telefono !== "N/A" && (
            <div className="flex items-center text-sm">
              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
              {proveedor.telefono}
            </div>
          )}
          {proveedor.email !== "N/A" && (
            <div className="flex items-center text-sm">
              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
              {proveedor.email}
            </div>
          )}
          {proveedor.telefono === "N/A" &&
            proveedor.email === "N/A" &&
            "No especificado"}
        </div>
      ),
    },
    {
      header: "Documento",
      accessor: (proveedor: Proveedor) => (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {proveedor.tipoDocumento}: {proveedor.numeroDocumento}
        </div>
      ),
      className: "w-[180px]",
    },
  ];

  const DeleteConfirmationDialog = () => {
    if (!isMobile) {
      return (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el proveedor
                {proveedorToDelete && ` ${proveedorToDelete.nombre}`}
                {` y todos sus datos asociados.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
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
              Se eliminará permanentemente el proveedor
              {proveedorToDelete && ` ${proveedorToDelete.nombre}`}
              {` y todos sus datos asociados.`}
            </p>
          </div>
          <DrawerFooter>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="w-full"
            >
              Eliminar proveedor
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
            Proveedores
          </h1>
          <p className="text-muted-foreground">
            Administre los proveedores registrados en el sistema.
          </p>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {getViewMode().toString() === "list" ? (
            <motion.div
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="w-full"
            >
              <DataTable
                data={filteredProveedores}
                columns={columns}
                title="Listado de Proveedores"
                description="Gestión de proveedores del sistema"
                onRowClick={handleRowClick}
                searchKeys={["nombre", "numeroDocumento"]}
                searchPlaceholder="Buscar proveedor..."
                actions={
                  canEditProveedores ? (
                    <DataTableActions
                      onAdd={handleAddProveedor}
                      addLabel="Nuevo Proveedor"
                    />
                  ) : null
                }
                onEdit={canEditProveedores ? handleEdit : undefined}
                onDelete={canDeleteProveedores ? handleDelete : undefined}
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
                damping: 30,
              }}
              className="w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar proveedor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                {canEditProveedores && (
                  <Button onClick={handleAddProveedor} className="ml-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Proveedor
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
                  damping: 30,
                }}
              >
                <AnimatePresence mode="wait">
                  {filteredProveedores.map((proveedor) => (
                    <motion.div
                      key={proveedor.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <ProveedorCard
                        proveedor={proveedor}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                  {canEditProveedores && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.2,
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <AddProveedorCard onAdd={handleAddProveedor} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isDesktop ? (
        <Dialog
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? (
                  "Editar Proveedor"
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Nuevo Proveedor</span>
                  </div>
                )}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Modifique los datos del proveedor"
                  : "Complete los datos del nuevo proveedor"}
              </DialogDescription>
            </DialogHeader>
            <ProveedorForm
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              isEditing={isEditing}
              onCancel={() => setShowModal(false)}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open);
            if (!open) resetForm();
          }}
        >
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {isEditing ? (
                  "Editar Proveedor"
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Nuevo Proveedor</span>
                  </div>
                )}
              </DrawerTitle>
              <DrawerDescription>
                {isEditing
                  ? "Modifique los datos del proveedor"
                  : "Complete los datos del nuevo proveedor"}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <ProveedorForm
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                isEditing={isEditing}
                onCancel={() => setShowModal(false)}
              />
            </div>
            <DrawerFooter className="pt-2">
              <Button onClick={(e) => handleSubmit(e)} className="w-full">
                {isEditing ? "Actualizar Proveedor" : "Guardar Proveedor"}
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

export default Proveedores;
