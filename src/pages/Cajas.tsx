import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { DataTable, DataTableActions } from "@/components/ui/DataTable";
import { formatCurrency } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Check,
  X,
  Plus,
  Search,
  PenSquare,
  XSquare,
} from "lucide-react";
import { Caja } from "@/types/caja.interface";
import { Empresa } from "@/types";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  getAllCajas,
  createCaja,
  updateCaja,
  deleteCaja,
} from "@/services/cajaService";
import { useAuth } from "@/contexts/AuthContext";
import { getAllEmpresas } from "@/services/empresaService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { v4 as uuidv4 } from "uuid";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const tableVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const Cajas = () => {
  const { toast } = useToast();
  const { getViewMode, canEdit, canManageCajas } = useRolePermissions();
  const { empresaId } = useAuth();
  const viewMode = getViewMode();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [newCaja, setNewCaja] = useState<Omit<Caja, "id">>({
    numero: 1,
    nombre: "Caja #1",
    efectivo: "0.00",
    empresaId: empresaId ?? 0,
  });
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [deletingCaja, setDeletingCaja] = useState<Caja | null>(null);
  const [isCreatingDialog, setIsCreatingDialog] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [newCajaForm, setNewCajaForm] = useState<Omit<Caja, "id">>({
    numero: 1,
    nombre: "Caja #1",
    efectivo: "0.00",
    empresaId: empresaId ?? 0,
  });
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const allEmpresas = await getAllEmpresas();
        setEmpresas(allEmpresas);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las empresas",
          variant: "destructive",
        });
      }
    };

    loadEmpresas();

    const loadCajas = async () => {
      try {
        const allCajas = await getAllCajas();
        const filteredCajas = empresaId
          ? allCajas.filter((caja) => caja.empresaId === empresaId)
          : allCajas;
        setCajas(filteredCajas);
        setNewCaja({
          numero: filteredCajas.length + 1,
          nombre: `Caja #${filteredCajas.length + 1}`,
          efectivo: "0.00",
          empresaId: empresaId ?? 0,
        });
        const nextNumber = filteredCajas.length + 1;
        setNewCajaForm({
          numero: nextNumber,
          nombre: `Caja #${nextNumber}`,
          efectivo: "0.00",
          empresaId: empresaId ?? 0,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las cajas",
          variant: "destructive",
        });
      }
    };
    loadCajas();
  }, []);

  const handleRowClick = (caja: Caja) => {
    toast({
      title: caja.nombre,
      description: `Efectivo actual: ${formatCurrency(caja.efectivo)}`,
    });
  };

  const handleEdit = (caja: Caja) => {
    setEditingCaja(caja);
  };

  const handleSaveEdit = async () => {
    if (!editingCaja) return;

    try {
      const updatedCaja = await updateCaja(editingCaja.id, {
        numero: editingCaja.numero,
        nombre: editingCaja.nombre,
        efectivo: editingCaja.efectivo,
      });

      setCajas(cajas.map((c) => (c.id === updatedCaja.id ? updatedCaja : c)));
      toast({
        title: "Caja actualizada",
        description: `Se ha actualizado ${updatedCaja.nombre}`,
      });
      setEditingCaja(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la caja",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (caja: Caja) => {
    setDeletingCaja(caja);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCaja) return;

    try {
      await deleteCaja(deletingCaja.id);
      setCajas(cajas.filter((c) => c.id !== deletingCaja.id));
      toast({
        title: "Caja eliminada",
        description: `Se ha eliminado ${deletingCaja.nombre}`,
      });
      setDeletingCaja(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la caja",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      header: "ID",
      accessor: (caja: Caja) => caja.id.toString(),
    },
    {
      header: "Número",
      accessor: (caja: Caja) => caja.numero.toString(),
    },
    {
      header: "Nombre",
      accessor: (caja: Caja) => caja.nombre,
    },
    {
      header: "Efectivo",
      accessor: (caja: Caja) => formatCurrency(caja.efectivo),
      className: "font-medium",
    },
    {
      header: "Estado",
      accessor: (caja: Caja) => (
        <div className="flex items-center">
          <span
            className={`h-2 w-2 rounded-full mr-2 ${
              parseFloat(caja.efectivo) > 0 ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          {parseFloat(caja.efectivo) > 0 ? "Activa" : "Sin efectivo"}
        </div>
      ),
    },
  ];

  const handleAddCaja = () => {
    setIsCreatingDialog(true);
  };

  const handleSaveCaja = async () => {
    if (!newCajaForm) return;

    try {
      const randomName = uuidv4();
      const createdCaja = await createCaja({
        numero: newCajaForm.numero,
        nombre: randomName,
        efectivo: newCajaForm.efectivo,
        empresaId: newCajaForm.empresaId,
      });

      setCajas([...cajas, createdCaja]);
      toast({
        title: "Caja agregada",
        description: `Se ha agregado ${createdCaja.nombre} al sistema.`,
      });
      setIsCreatingDialog(false);
      const nextNumber = cajas.length + 2;
      setNewCajaForm({
        numero: nextNumber,
        nombre: `Caja #${nextNumber}`,
        efectivo: "0.00",
        empresaId: empresaId ?? 0,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la caja",
        variant: "destructive",
      });
    }
  };

  const filteredCajas = searchQuery
    ? cajas.filter(
        (caja) =>
          caja.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          caja.numero.toString().includes(searchQuery)
      )
    : cajas;

  const renderEditDialog = () => {
    const content = (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-numero">Número</Label>
          <Input
            id="edit-numero"
            type="number"
            value={editingCaja?.numero}
            onChange={(e) =>
              setEditingCaja({
                ...editingCaja!,
                numero: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-nombre">Nombre</Label>
          <Input
            id="edit-nombre"
            type="text"
            value={editingCaja?.nombre}
            onChange={(e) =>
              setEditingCaja({
                ...editingCaja!,
                nombre: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-efectivo">Efectivo</Label>
          <Input
            id="edit-efectivo"
            type="text"
            value={editingCaja?.efectivo}
            onChange={(e) =>
              setEditingCaja({
                ...editingCaja!,
                efectivo: e.target.value,
              })
            }
          />
        </div>
      </div>
    );

    if (isDesktop) {
      return (
        <Dialog open={!!editingCaja} onOpenChange={() => setEditingCaja(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Caja</DialogTitle>
            </DialogHeader>
            {content}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCaja(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>Guardar cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={!!editingCaja} onOpenChange={() => setEditingCaja(null)}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Editar Caja</DrawerTitle>
            <DrawerDescription>
              Modifique los datos de la caja aquí
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">{content}</div>
          <DrawerFooter className="pt-2">
            <Button onClick={handleSaveEdit}>Guardar cambios</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const renderCreateDialog = () => {
    const content = (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-numero">Número</Label>
          <Input
            id="new-numero"
            type="number"
            value={newCajaForm.numero}
            onChange={(e) =>
              setNewCajaForm({
                ...newCajaForm,
                numero: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-nombre">Nombre</Label>
          <Input
            id="new-nombre"
            type="text"
            value={newCajaForm.nombre}
            onChange={(e) =>
              setNewCajaForm({
                ...newCajaForm,
                nombre: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-efectivo">Efectivo Inicial</Label>
          <Input
            id="new-efectivo"
            type="text"
            value={newCajaForm.efectivo}
            onChange={(e) =>
              setNewCajaForm({
                ...newCajaForm,
                efectivo: e.target.value,
              })
            }
          />
        </div>
        {canManageCajas() && (
          <div className="space-y-2">
            <Label htmlFor="new-empresa">Empresa</Label>
            <Select
              onValueChange={(value) =>
                setNewCajaForm({ ...newCajaForm, empresaId: parseInt(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione una empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );

    if (isDesktop) {
      return (
        <Dialog
          open={isCreatingDialog}
          onOpenChange={() => setIsCreatingDialog(false)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Caja</DialogTitle>
            </DialogHeader>
            {content}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreatingDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveCaja}>Crear Caja</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer
        open={isCreatingDialog}
        onOpenChange={() => setIsCreatingDialog(false)}
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Nueva Caja</DrawerTitle>
            <DrawerDescription>
              Complete los datos para crear una nueva caja
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">{content}</div>
          <DrawerFooter className="pt-2">
            <Button onClick={handleSaveCaja}>Crear Caja</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
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
            <CreditCard className="mr-3 h-8 w-8 text-orange-500" />
            Cajas
          </h1>
          <p className="text-muted-foreground">
            Administre las cajas registradoras del sistema.
          </p>
        </motion.div>

        {/* Cards view for Cajero and Encargado */}
        {viewMode === "cards" && (
          <motion.div variants={itemVariants}>
            {/* Search and Add button for Encargado */}
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar caja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {canManageCajas() && !isCreating && (
                <button
                  onClick={handleAddCaja}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Caja
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredCajas.map((caja) => (
                <div
                  key={caja.id}
                  className="bg-transparent p-5 rounded-xl border shadow-sm transition-all card-hover"
                  onClick={() => handleRowClick(caja)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{caja.nombre}</h3>
                      <p className="text-sm text-muted-foreground">
                        Caja #{caja.numero}
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-orange-100">
                      <CreditCard className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-bold">
                      {formatCurrency(caja.efectivo)}
                    </span>
                    <div className="mt-2 flex items-center">
                      <span
                        className={`h-2 w-2 rounded-full mr-2 ${
                          parseFloat(caja.efectivo) > 0
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm">
                        {parseFloat(caja.efectivo) > 0
                          ? "Activa"
                          : "Sin efectivo"}
                      </span>
                    </div>
                  </div>

                  {/* Show buttons only if user has permission */}
                  {canEdit() && (
                    <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-2 rounded-md hover:bg-blue-50 text-blue-500 border border-input"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(caja);
                              }}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar caja</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {canManageCajas() && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="p-2 rounded-md hover:bg-red-50 text-red-500 border border-input"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(caja);
                                }}
                              >
                                <XSquare className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cerrar caja</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {canManageCajas() && !isCreating ? (
                <div
                  onClick={() => setIsCreating(true)}
                  className="bg-transparent p-5 rounded-xl border border-dashed shadow-sm flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">Agregar nueva caja</p>
                  <p className="text-sm text-muted-foreground">
                    Clic para agregar
                  </p>
                </div>
              ) : (
                isCreating && (
                  <div className="bg-transparent p-5 rounded-xl border shadow-sm">
                    <div className="mb-4">
                      <h3 className="font-medium text-lg">Nueva Caja</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete los detalles
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          type="number"
                          value={newCaja.numero}
                          onChange={(e) =>
                            setNewCaja({
                              ...newCaja,
                              numero: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          type="text"
                          value={newCaja.nombre}
                          onChange={(e) =>
                            setNewCaja({
                              ...newCaja,
                              nombre: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="efectivo">Efectivo Inicial</Label>
                        <Input
                          id="efectivo"
                          type="text"
                          value={newCaja.efectivo}
                          onChange={(e) =>
                            setNewCaja({
                              ...newCaja,
                              efectivo: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setIsCreating(false)}
                              className="p-2 rounded-md hover:bg-foreground/10 text-foreground border border-input"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancelar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleSaveCaja}
                              className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 border border-primary"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Guardar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Table view for Admin */}
        {(viewMode === "table" || viewMode === "list") && (
          <motion.div variants={tableVariants} initial="hidden" animate="show">
            <DataTable
              data={filteredCajas}
              columns={columns}
              title="Listado de Cajas"
              description="Todas las cajas registradoras del sistema"
              onRowClick={handleRowClick}
              searchKeys={["nombre", "numero"]}
              searchPlaceholder="Buscar por nombre o número..."
              actions={
                canEdit() && (
                  <Button onClick={handleAddCaja}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Caja
                  </Button>
                )
              }
              onEdit={canEdit() ? handleEdit : undefined}
              onDelete={canManageCajas() ? handleDelete : undefined}
              className="transition-all hover:scale-[1.01]"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Replace the existing dialogs with the new responsive ones */}
      {renderEditDialog()}
      {renderCreateDialog()}

      <AlertDialog
        open={!!deletingCaja}
        onOpenChange={() => setDeletingCaja(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              caja
              {deletingCaja && ` "${deletingCaja.nombre}"`} del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCaja(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Cajas;
