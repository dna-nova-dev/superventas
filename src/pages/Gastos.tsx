import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, DataTableActions } from '@/components/ui/DataTable';
import {  formatCurrency, formatDate } from '@/data/mockData';
import { Gasto } from '@/types';
import { Caja } from '@/types/caja.interface';
import { 
  Wallet, 
  CreditCard, 
  BanknoteIcon, 
  ArrowDownToLine, 
  Filter,
  PlusCircle,
  PenSquare,
  XSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Added DialogFooter, DialogClose
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { getGastos, createGasto, deleteGasto, updateGasto } from '@/services/gastosService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getAllCajas } from '@/services/cajaService';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { GastoForm } from '@/components/gastos/GastoForm';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const gastoSchema = z.object({
  razon: z.string().min(3, { message: 'La razón debe tener al menos 3 caracteres' }),
  monto: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'El monto debe ser un número positivo',
  }),
  fondo: z.enum(['Efectivo', 'Transferencia', 'Tarjeta']),
  id: z.string().min(1, { message: 'Selecciona una caja' }), // Changed key to id, kept as string for form
});


type GastoFormValues = z.infer<typeof gastoSchema>; 

type GastoDTO = Omit<Gasto, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

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

import { Variants } from "framer-motion";

const tableVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  show: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] // cubic-bezier equivalent for easeOut
    }
  }
};

const Gastos = () => {
  const { toast } = useToast();
  const { empresaId } = useAuth();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCajaId, setSelectedCajaId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState<Gasto | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [gastosData, cajasData] = await Promise.all([getGastos(), getAllCajas()]);
      setGastos(gastosData);
      setCajas(cajasData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteMutation = useMutation({
    mutationFn: deleteGasto,
    onSuccess: () => {
      setGastos((prev) => prev.filter((gasto) => gasto.id !== gastoToDelete?.id));
      toast({
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado correctamente",
      });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        variant: "destructive",
      });
    },
  });

  // Use the inferred GastoFormValues type for useForm
  const form = useForm<GastoFormValues>({ 
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      razon: '',
      monto: '',
      fondo: 'Efectivo',
      id: '',
    },
    shouldUnregister: false,
  });

  // Combined create/update mutation
  // Updated mutationFn to accept an object with optional id and payload
  const gastoMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: GastoDTO }) => {
      if (id) {
        return updateGasto(id, payload);
      } else {
        return createGasto(payload);
      }
    },
    onSuccess: (updatedOrNewGasto) => {
      if (editingGasto) {
        setGastos((prev) => 
          prev.map((g) => (g.id === updatedOrNewGasto.id ? updatedOrNewGasto : g))
        );
        toast({
          title: "Gasto actualizado",
          description: "El gasto ha sido actualizado correctamente",
        });
      } else {
        setGastos((prev) => [...prev, updatedOrNewGasto]);
        toast({
          title: "Gasto registrado",
          description: "El gasto ha sido registrado correctamente",
        });
      }
      setOpenDialog(false);
      setEditingGasto(null); // Reset editing state
      form.reset(); // Reset form
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo ${editingGasto ? 'actualizar' : 'registrar'} el gasto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // onSubmit now receives GastoFormValues
  const onSubmit = async (values: GastoFormValues) => { 
    // Prepare data payload for the API call, matching Gasto type expectations
    const payload: GastoDTO = {
      razon: values.razon,
      monto: values.monto,
      fondo: values.fondo,
      cajaId: parseInt(values.id, 10),
      empresaId: empresaId,
    };

    // Pass necessary data to the mutation function
    if (editingGasto) {
      // Pass ID and payload for update
      gastoMutation.mutate({ id: editingGasto.id, payload }); 
    } else {
      // Pass only payload for create
      gastoMutation.mutate({ payload }); 
    }
  };


  const handleEdit = (gasto: Gasto) => {
    setEditingGasto(gasto);
    // Reset form with values converted to match GastoFormValues (all strings expected by schema)
    form.reset({
      razon: gasto.razon,
      monto: gasto.monto, // Already string in Gasto type
      fondo: gasto.fondo,
      id: gasto.cajaId.toString(), // Convert number to string for form/schema
    });
    setOpenDialog(true);
  };

  const handleDelete = (gasto: Gasto) => {
    setGastoToDelete(gasto);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (gastoToDelete) {
      deleteMutation.mutate(gastoToDelete.id);
    }
  };

  const renderDialog = () => {
    const isEditing = !!editingGasto; // Determine if editing
    const content = (
      <GastoForm 
        form={form}
        onSubmit={onSubmit}
        cajas={cajas}
        isEditing={isEditing} // Pass isEditing prop
      />
    );

    if (isDesktop) {
      return (
        // Reset editingGasto when dialog closes
        <Dialog open={openDialog} onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingGasto(null);
            form.reset(); // Also reset form on close
          }
        }}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Gasto' : 'Registrar nuevo gasto'}</DialogTitle>
            </DialogHeader>
            {content}
            {/* Add DialogFooter for desktop */}
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              {/* Submit button targets the form via its ID */}
              <Button type="submit" form="gasto-form"> 
                  {isEditing ? 'Guardar Cambios' : 'Crear Gasto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={openDialog} onOpenChange={setOpenDialog}>
        <DrawerContent className="fixed inset-x-0 bottom-0">
          <DrawerHeader className="sticky top-0 z-10 bg-background border-b">
            <DrawerTitle>{editingGasto ? 'Editar Gasto' : 'Registrar nuevo gasto'}</DrawerTitle>
            <DialogDescription>
              {editingGasto 
                ? 'Modifica los detalles del gasto seleccionado.' 
                : 'Completa el formulario para registrar un nuevo gasto.'}
            </DialogDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {content}
          </div>
          <DrawerFooter>
            {/* Submit button targets the form via its ID */}
            <Button 
              type="submit" 
              form="gasto-form" 
              className="w-full"
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Gasto'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };

  const gastosFiltrados = gastos.filter((gasto) => {
    const matchesEmpresa = gasto.empresaId === empresaId;
    const matchesCaja = selectedCajaId ? gasto.cajaId === selectedCajaId : true;
    const matchesPayment = selectedPaymentMethod ? gasto.fondo === selectedPaymentMethod : true;
    return matchesEmpresa && matchesCaja && matchesPayment;
  });

  const gastosEmpresa = gastos.filter(g => g.empresaId === empresaId);

  // Calcular totales solo para la empresa actual
  const totalEfectivo = gastosEmpresa
    .filter(g => g.fondo === 'Efectivo')
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);
  
  const totalTransferencia = gastosEmpresa
    .filter(g => g.fondo === 'Transferencia')
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);
  
  const totalTarjeta = gastosEmpresa
    .filter(g => g.fondo === 'Tarjeta')
    .reduce((sum, g) => sum + parseFloat(g.monto), 0);
  
  const totalGeneral = gastosEmpresa.reduce((sum, g) => sum + parseFloat(g.monto), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const columns = [
    {
      header: 'ID',
      accessor: (gasto: Gasto) => gasto.id.toString(),
      className: 'w-16',
    },
    {
      header: 'Razón',
      accessor: (gasto: Gasto) => gasto.razon,
    },
    {
      header: 'Monto',
      accessor: (gasto: Gasto) => formatCurrency(gasto.monto),
      className: 'font-medium',
    },
    {
      header: 'Método de Pago',
      accessor: (gasto: Gasto) => {
        return (
          <div className="flex items-center">
            {gasto.fondo === 'Efectivo' && <BanknoteIcon className="mr-2 h-4 w-4 text-green-500" />}
            {gasto.fondo === 'Transferencia' && <ArrowDownToLine className="mr-2 h-4 w-4 text-blue-500" />}
            {gasto.fondo === 'Tarjeta' && <CreditCard className="mr-2 h-4 w-4 text-purple-500" />}
            {gasto.fondo}
          </div>
        );
      },
    },
    {
      header: 'Fecha',
      accessor: (gasto: Gasto) => formatDate(gasto.createdAt),
    },
    {
      header: 'Acciones',
      accessor: (gasto: Gasto) => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-50/50 border-muted"
              onClick={() => handleEdit(gasto)}
            >
              <PenSquare className="h-4 w-4 text-primary/80" />
              <span className="sr-only">Editar</span>
            </Button>
            {canDelete() && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50/50 border-muted"
                onClick={() => handleDelete(gasto)}
              >
                <XSquare className="h-4 w-4 text-destructive/80" />
                <span className="sr-only">Eliminar</span>
              </Button>
            )}
          </div>
        );
      },
      className: 'w-[100px]',
    }
  ];

  const activeFilters = [
    selectedCajaId && `Caja ${cajas.find(c => c.id === selectedCajaId)?.nombre}`,
    selectedPaymentMethod && selectedPaymentMethod
  ].filter(Boolean);

  const metodosPago = [
    { value: 'Efectivo', label: 'Efectivo', icon: BanknoteIcon, color: 'text-green-500' },
    { value: 'Transferencia', label: 'Transferencia', icon: ArrowDownToLine, color: 'text-blue-500' },
    { value: 'Tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'text-purple-500' },
  ];

  const DeleteConfirmationDialog = (
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Confirmar eliminación</DialogTitle>
        </DialogHeader>
        <div className="py-3">
          <p>¿Estás seguro de que deseas eliminar este gasto?</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Layout>
      <motion.div 
        className="space-y-6 relative w-full max-w-full overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
                <p className="text-muted-foreground">
                  Administra los gastos del negocio
                </p>
              </div>
            </div>
          </div>
        </motion.div>


        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-full"
          variants={containerVariants}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Efectivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <BanknoteIcon className="h-5 w-5 text-green-500" />
                <p className="text-2xl font-bold">{formatCurrency(totalEfectivo)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transferencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <ArrowDownToLine className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold">{formatCurrency(totalTransferencia)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tarjetas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <p className="text-2xl font-bold">{formatCurrency(totalTarjeta)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-red-500" />
                <p className="text-2xl font-bold">{formatCurrency(totalGeneral)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div 
          className="w-full overflow-x-auto"
          variants={tableVariants}
          initial="hidden"
          animate="show"
        >
          <DataTable 
            data={gastosFiltrados}
            columns={columns}
            title="Listado de Gastos"
            description="Registro completo de todos los gastos realizados"
            searchKeys={['razon']}
            searchPlaceholder="Buscar por razón..."
            itemsPerPage={10}
            actions={
              <div className="flex gap-2 justify-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative sm:gap-2 px-2 sm:px-3">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtrar</span>
                      {activeFilters.length > 0 && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-2">
                      <div className="space-y-2">
                        <div className="px-2 py-1.5">
                          <h4 className="text-sm font-medium mb-2">Cajas</h4>
                          <div className="space-y-2">
                            {cajas.map((caja) => (
                              <div key={caja.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`caja-${caja.id}`}
                                  checked={selectedCajaId === caja.id}
                                  onCheckedChange={(checked) => {
                                    setSelectedCajaId(checked ? caja.id : null);
                                  }}
                                />
                                <label
                                  htmlFor={`caja-${caja.id}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {caja.nombre}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="px-2 py-1.5">
                          <h4 className="text-sm font-medium mb-2">Método de pago</h4>
                          <div className="space-y-2">
                            {metodosPago.map(({ value, label, icon: Icon, color }) => (
                              <div key={value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`metodo-${value}`}
                                  checked={selectedPaymentMethod === value}
                                  onCheckedChange={(checked) => {
                                    setSelectedPaymentMethod(checked ? value : null);
                                  }}
                                />
                                <label
                                  htmlFor={`metodo-${value}`}
                                  className="flex items-center space-x-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  <Icon className={`h-4 w-4 ${color}`} />
                                  <span>{label}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(selectedCajaId || selectedPaymentMethod) && (
                          <>
                            <Separator className="my-2" />
                            <div className="px-2 py-1.5">
                              <Button 
                                variant="ghost" 
                                className="w-full text-xs h-7"
                                onClick={() => {
                                  setSelectedCajaId(null);
                                  setSelectedPaymentMethod(null);
                                }}
                              >
                                Limpiar filtros
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  className="gap-2 px-3 w-full"
                  onClick={() => {
                    setEditingGasto(null); // Ensure we are in create mode
                    form.reset(); // Reset form for new entry
                    setOpenDialog(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Registrar Gasto
                </Button>
              </div>
            }
            className="w-full"
          />
        </motion.div>
      </motion.div>
      {renderDialog()}
      {DeleteConfirmationDialog}
    </Layout>
  );
};

export default Gastos;
