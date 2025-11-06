import { getAllProductos } from "../services/productoService";
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { DataTable, DataTableActions } from '@/components/ui/DataTable';
import { useToast } from '@/hooks/use-toast';
import { Tag, MapPin, Plus, Search, PenSquare, XSquare } from 'lucide-react';
import { Categoria, Producto } from '@/types';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { CategoryDialog } from '@/components/dialogs/CategoryDialog';
import { DeleteDialog } from '@/components/dialogs/DeleteDialog';
import { getAllCategorias, createCategoria, updateCategoria, deleteCategoria } from '@/services/categoriaService';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Productos from "./Productos";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
};

// Importar tipos de Framer Motion
import type { Variants } from 'framer-motion';

// Definir las variantes de animación
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

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
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

const Categorias = () => {
  const { toast } = useToast();
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const { empresaId, user } = useAuth();
  const viewMode = getViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [openProductsDrawer, setOpenProductsDrawer] = useState(false);
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState<Producto[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const isMobile = useMediaQuery("(max-width: 768px)");

  const loadCategorias = useCallback(async () => {
    try {
      // Pasar el empresaId directamente a getAllCategorias para filtrar en el servidor
      const data = await getAllCategorias(empresaId);
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive"
      });
    }
  }, [empresaId, toast]);

  const loadProductos = useCallback(async () => {
    const data = await getAllProductos();
    setProductos(data);
  }, []);

  const loadAllData = useCallback(async () => {
    await loadCategorias();
    await loadProductos();
  }, [loadCategorias, loadProductos]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRowClick = (categoria: Categoria) => {
    const filteredProducts = productos.filter(p => p.categoriaId === categoria.id);
    setSelectedCategoryProducts(filteredProducts);
    setSelectedCategoryName(categoria.nombre);
    setOpenProductsDrawer(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleDelete = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCategoria) {
      const deleted = deleteCategoria(selectedCategoria.id);
      if (deleted) {
        toast({
          title: "Categoría eliminada",
          description: `Se ha eliminado la categoría ${selectedCategoria.nombre}`,
        });
        loadCategorias();
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar la categoría",
          variant: "destructive"
        });
      }
      setOpenDeleteDialog(false);
      setSelectedCategoria(null);
    }
  };

  const handleAddCategoria = () => {
    setDialogMode('create');
    setSelectedCategoria(null);
    setOpenDialog(true);
  };

  const handleSubmitCategoria = async (data: { nombre: string; ubicacion: string }) => {
    try {
      if (dialogMode === 'create') {
        // Asegurarse de que tenemos un empresaId válido
        const currentEmpresaId = empresaId || user?.empresaId;
        
        if (!currentEmpresaId) {
          throw new Error('No se pudo determinar la empresa para la categoría');
        }

        const newCategoria = await createCategoria({
          nombre: data.nombre,
          ubicacion: data.ubicacion,
          empresaId: currentEmpresaId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null
        });
        
        toast({
          title: "Categoría creada",
          description: `Se ha creado la categoría ${newCategoria.nombre}`
        });
      } else if (selectedCategoria) {
        const updated = updateCategoria(selectedCategoria.id, {
          nombre: data.nombre,
          ubicacion: data.ubicacion
        });
        if (updated) {
          toast({
            title: "Categoría actualizada",
            description: `Se ha actualizado la categoría ${(await updated).nombre}`
          });
        }
      }
      loadCategorias();
      setOpenDialog(false);
      setSelectedCategoria(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la operación",
        variant: "destructive"
      });
    }
  };

  const getProductCount = (categoriaId: number) => {
    return productos.filter(p => p.categoriaId === categoriaId).length;
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      "bg-red-100/50 text-red-700 dark:bg-red-500/20 dark:text-red-400",
      "bg-blue-100/50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      "bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-400",
      "bg-yellow-100/50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
      "bg-purple-100/50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
      "bg-pink-100/50 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400"
    ];
    return colors[index % colors.length];
  };

  const filteredCategorias = searchQuery
    ? categorias.filter(categoria =>
        categoria.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoria.ubicacion.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categorias;

  const columns = [
    {
      header: "ID",
      accessor: (categoria: Categoria) => categoria.id.toString(),
      className: "w-[60px]"
    },
    {
      header: "Nombre",
      accessor: (categoria: Categoria) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <Tag className="h-4 w-4 text-red-500" />
          </div>
          <span className="font-medium">{categoria.nombre}</span>
        </div>
      )
    },
    {
      header: "Ubicación",
      accessor: (categoria: Categoria) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
          {categoria.ubicacion}
        </div>
      )
    },
    {
      header: "Productos",
      accessor: (categoria: Categoria) => {
        const productCount = getProductCount(categoria.id);
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {productCount} producto{productCount !== 1 ? 's' : ''}
          </div>
        );
      }
    }
  ];

  const renderMobileDrawers = () => (
    <>
      <Drawer open={openDialog} onOpenChange={setOpenDialog}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {dialogMode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmitCategoria({
                nombre: formData.get('nombre') as string,
                ubicacion: formData.get('ubicacion') as string
              });
            }} className="space-y-4">
              <Input
                name="nombre"
                defaultValue={selectedCategoria?.nombre}
                placeholder="Nombre de la categoría"
              />
              <Input
                name="ubicacion"
                defaultValue={selectedCategoria?.ubicacion}
                placeholder="Ubicación"
              />
              <DrawerFooter>
                <Button type="submit">
                  {dialogMode === 'create' ? 'Crear' : 'Actualizar'}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">
                    Cancelar
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Eliminar categoría</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Está seguro que desea eliminar la categoría {selectedCategoria?.nombre}?
            </p>
            <DrawerFooter>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Eliminar
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );

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
            <Tag className="mr-3 h-8 w-8 text-red-500" />
            Categorías
          </h1>
          <p className="text-muted-foreground">
            Administre las categorías de productos.
          </p>
        </motion.div>

        {viewMode === 'cards' && (
          <motion.div variants={containerVariants}>
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar categoría..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              
              {canEdit() && (
                <button
                  onClick={handleAddCategoria}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Categoría
                </button>
              )}
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={containerVariants}
            >
              {filteredCategorias.map((categoria, index) => {
                const productCount = getProductCount(categoria.id);
                const colorClass = getCategoryColor(index);
                return (
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={categoria.id}
                    className="rounded-xl border shadow-sm overflow-hidden transition-all card-hover"
                    onClick={() => handleRowClick(categoria)}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                          {categoria.nombre}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-red-100/50 dark:bg-red-500/20 flex items-center justify-center">
                          <Tag className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{categoria.ubicacion}</span>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total productos:</span>
                          <span className="font-semibold">{productCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 px-5 py-3 flex justify-between">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="p-2 rounded-md hover:bg-blue-100/50 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(categoria);
                              }}
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar categoría</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              className="p-2 rounded-md hover:bg-red-100/50 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(categoria);
                              }}
                            >
                              <XSquare className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar categoría</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                );
              })}

              {canEdit() && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  onClick={handleAddCategoria}
                  className="bg-transparent p-5 rounded-xl border border-dashed shadow-sm flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">Agregar nueva categoría</p>
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
              data={filteredCategorias}
              columns={columns}
              title="Listado de Categorías"
              description="Todas las categorías de productos"
              onRowClick={handleRowClick}
              searchKeys={["nombre", "ubicacion"]}
              searchPlaceholder="Buscar categoría..."
              actions={canEdit() ? <DataTableActions onAdd={handleAddCategoria} addLabel="Nueva Categoría" /> : null}
              onEdit={canEdit() ? handleEdit : undefined}
              onDelete={canDelete() ? handleDelete : undefined}
              className="transition-all hover:scale-[1.01]"
            />
          </motion.div>
        )}

        {isMobile ? (
          <>
            {renderMobileDrawers()}
            <Drawer open={openProductsDrawer} onOpenChange={setOpenProductsDrawer}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Productos en {selectedCategoryName}</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                  {selectedCategoryProducts.length === 0 ? (
                    <p className="text-muted-foreground">No hay productos en esta categoría.</p>
                  ) : (
                    selectedCategoryProducts.map((producto) => (
                      <div key={producto.id} className="border rounded-md p-3 flex justify-between items-center">
<div className="flex flex-col w-full">
  <span className="font-medium">{producto.nombre}</span>
  <div className="flex justify-between text-sm mt-1">
    <span>Compra: ${Number(producto.precioCompra).toFixed(2)}</span>
    <span>Venta: ${Number(producto.precioVenta).toFixed(2)}</span>
    <span>Stock: {producto.stockTotal}</span>
  </div>
</div>
                      </div>
                    ))
                  )}
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <>
            <CategoryDialog 
              open={openDialog}
              onOpenChange={setOpenDialog}
              onSubmit={handleSubmitCategoria}
              categoria={selectedCategoria || undefined}
              mode={dialogMode}
            />
            
            <DeleteDialog
              open={openDeleteDialog}
              onOpenChange={setOpenDeleteDialog}
              onConfirm={handleConfirmDelete}
              title="Eliminar categoría"
              description={`¿Está seguro que desea eliminar la categoría ${selectedCategoria?.nombre}?`}
            />

            <Dialog open={openProductsDrawer} onOpenChange={setOpenProductsDrawer}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Productos en {selectedCategoryName}</DialogTitle>
                </DialogHeader>
                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                  {selectedCategoryProducts.length === 0 ? (
                    <p className="text-muted-foreground">No hay productos en esta categoría.</p>
                  ) : (
                    selectedCategoryProducts.map((producto) => (
                      <div key={producto.id} className="border rounded-md p-3 flex justify-between items-center">
<div className="flex flex-col w-full">
  <span className="font-medium">{producto.nombre}</span>
  <div className="flex justify-between text-sm mt-1">
    <span>Compra: ${Number(producto.precioCompra).toFixed(2)}</span>
    <span>Venta: ${Number(producto.precioVenta).toFixed(2)}</span>
    <span>Stock: {producto.stockTotal}</span>
  </div>
</div>
                      </div>
                    ))
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cerrar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default Categorias;
