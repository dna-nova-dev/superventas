import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Layout } from '@/components/layout/Layout';
import { DataTable, DataTableActions } from '@/components/ui/DataTable';
import { formatCurrency } from '@/data/mockData';
import { Package, Plus, Search, PenSquare, XSquare } from 'lucide-react';
import { Producto, Categoria } from '@/types';

import { useToast } from '@/hooks/use-toast';
import { getAllCategorias } from '@/services/categoriaService';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { getImageSrc } from '@/utils/imageUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Cloudinary } from '@cloudinary/url-gen';
import { AdvancedImage } from '@cloudinary/react';
import { 
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} from '@/services/productoService';
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
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

const Productos = () => {
  const { toast } = useToast();
  const { getViewMode, canEdit, canDelete } = useRolePermissions();
  const { empresaId, user } = useAuth(); // Añadido user al destructuring
  const viewMode = getViewMode();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    codigo: '',
    nombre: '',
    stockTotal: '',
    tipoUnidad: '',
    precioCompra: '',
    precioVenta: '',
    marca: '',
    modelo: '',
    estado: 'Activo',
    categoriaId: '',
    foto: ''
  });
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllProducts = useCallback(async () => {
    try {
      if (!empresaId) {
        return;
      }
      
      const allProductos = await getAllProductos();
      const filteredProductos = allProductos.filter(
        (p: Producto) => p.empresaId === empresaId
      );
      setProductos(filteredProductos);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    }
  }, [empresaId, toast]);

  const loadCategorias = useCallback(async () => {
    try {
      if (!empresaId) {
        return;
      }
      
      // Pasar el empresaId directamente para filtrar en el servidor
      const categoriasFiltradas = await getAllCategorias(empresaId);
      setCategorias(categoriasFiltradas);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive"
      });
    }
  }, [empresaId, toast]);

  const loadAllData = useCallback(async () => {
    try {
      // Usar empresaId del contexto o del usuario
      const currentEmpresaId = empresaId || user?.empresaId;
      
      if (currentEmpresaId) {
        await Promise.all([
          loadAllProducts(),
          loadCategorias()
        ]);
      } else {
        setError('No se pudo determinar la empresa. Por favor, seleccione una empresa.');
      }
    } catch (error) {
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [empresaId, user, loadAllProducts, loadCategorias, toast]);

  // Cargar datos cuando cambia empresaId
  // Efecto para cargar datos cuando el componente se monta o cambia el empresaId o el usuario
  useEffect(() => {
    // Usar empresaId del contexto o del usuario
    const currentEmpresaId = empresaId || user?.empresaId;
    
    if (currentEmpresaId) {
      loadAllData();
    } 
    // Si no hay empresaId ni en el contexto ni en el usuario
    else if (user && !currentEmpresaId) {
      setError('No se pudo determinar la empresa. Por favor, seleccione una empresa.');
      setLoading(false);
    }
    // Si no hay usuario, probablemente debería redirigir al login
    else if (!user) {
      setError('No hay usuario autenticado. Por favor, inicie sesión.');
      setLoading(false);
    }
  }, [empresaId, user, loadAllData]);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);

  const handleRowClick = (producto: Producto) => {
    toast({
      title: producto.nombre,
      description: `Stock: ${producto.stockTotal} - Precio: ${formatCurrency(producto.precioVenta)}`
    });
  };

  const handleEdit = (producto: Producto) => {
    setEditingProduct(producto);
    setNewProduct({
      codigo: producto.codigo,
      nombre: producto.nombre,
      stockTotal: producto.stockTotal.toString(),
      tipoUnidad: producto.tipoUnidad,
      precioCompra: producto.precioCompra.toString(),
      precioVenta: producto.precioVenta.toString(),
      marca: producto.marca,
      modelo: producto.modelo,
      estado: producto.estado,
      categoriaId: producto.categoriaId.toString(),
      foto: producto.foto
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (producto: Producto) => {
    setProductoToDelete(producto);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!productoToDelete) return;

    deleteProducto(productoToDelete.id)
      .then(success => { // Changed from const success = ... to .then
        if (success) {
          loadAllProducts();
          toast({
            title: "Producto eliminado",
            description: `Se ha eliminado ${productoToDelete.nombre} del inventario`,
            variant: "default"
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo eliminar el producto",
            variant: "destructive"
          });
        }
        setDeleteConfirmOpen(false);
        setProductoToDelete(null);
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          variant: "destructive"
        });
        setDeleteConfirmOpen(false);
        setProductoToDelete(null);
      });
  };

  const getCategoriaName = (categoriaId: number) => {
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria ? categoria.nombre : "Sin categoría";
  };

  const columns = [
    {
      header: "Código",
      accessor: (producto: Producto) => producto.codigo,
      className: "w-28"
    },
    {
      header: "Nombre",
      accessor: (producto: Producto) => (
        <div className="flex items-center">
          <img
            src={getImageSrc(producto.foto, 'producto', producto.nombre)}
            alt={producto.nombre}
            className="w-8 h-8 rounded object-cover mr-2"
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="%23f0f0f0"/><text x="16" y="16" font-family="Arial" font-size="12" fill="%23999" text-anchor="middle" dominant-baseline="middle">${producto.nombre.charAt(0)}</text></svg>`;
            }}
          />
          <div className="flex flex-col">
            <span className="font-medium">{producto.nombre}</span>
            <span className="text-xs text-muted-foreground">{producto.marca} - {producto.modelo}</span>
          </div>
        </div>
      )
    },
    {
      header: "Categoría",
      accessor: (producto: Producto) => getCategoriaName(producto.categoriaId)
    },
    {
      header: "Stock",
      accessor: (producto: Producto) => (
        <div className="flex flex-col">
          <span>{producto.stockTotal} {producto.tipoUnidad}</span>
          <span className={`text-xs ${producto.estado === 'Activo' ? 'text-green-600' : 'text-red-600'}`}>
            {producto.estado}
          </span>
        </div>
      )
    },
    {
      header: "Precios",
      accessor: (producto: Producto) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatCurrency(producto.precioVenta)}</span>
          <span className="text-xs text-muted-foreground">Compra: {formatCurrency(producto.precioCompra)}</span>
        </div>
      ),
      className: "font-medium"
    }
  ];

  const handleAddProducto = () => {
    setIsDialogOpen(true);
  };

  const handleSubmitNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Update existing product
        const updated = await updateProducto(editingProduct.id, {
          ...newProduct,
          stockTotal: Number(newProduct.stockTotal),
          precioCompra: newProduct.precioCompra,
          precioVenta: newProduct.precioVenta,
          categoriaId: Number(newProduct.categoriaId),
        });

        if (updated) {
          toast({
            title: "Producto actualizado",
            description: `Se ha actualizado ${updated.nombre} en el inventario`,
          });
        }
      } else {
        // Create new product
        const created = await createProducto({
          ...newProduct,
          stockTotal: Number(newProduct.stockTotal),
          precioCompra: newProduct.precioCompra,
          precioVenta: newProduct.precioVenta,
          categoriaId: Number(newProduct.categoriaId),
          empresaId: empresaId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: ''
        });

        if (created) {
          toast({
            title: "Producto creado",
            description: `Se ha creado ${created.nombre} en el inventario`,
          });
        }
      }

      // Refresh products list
      await loadAllProducts();
      
      // Reset form
      setIsDialogOpen(false);
      setEditingProduct(null);
      setNewProduct({
        codigo: '',
        nombre: '',
        stockTotal: '',
        tipoUnidad: '',
        precioCompra: '',
        precioVenta: '',
        marca: '',
        modelo: '',
        estado: 'Activo',
        categoriaId: '',
        foto: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
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

      setNewProduct(prev => ({
        ...prev,
        foto: data.secure_url
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo subir la imagen",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const photoInputSection = (
    <div className="space-y-2">
      <Label htmlFor="foto">Foto del producto</Label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
          {newProduct.foto ? (
            <img src={newProduct.foto} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Package className="h-10 w-10 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <Input
            id="foto"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {uploading && (
            <p className="text-sm text-muted-foreground mt-1">
              Subiendo imagen...
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderMobileDrawers = () => (
    <>
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </DrawerTitle>
          </DrawerHeader>
          <form onSubmit={handleSubmitNewProduct} className="px-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                <TabsTrigger value="detalles" className="flex-1">Detalles</TabsTrigger>
                <TabsTrigger value="precios" className="flex-1">Precios</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                {photoInputSection}
                <Input
                  placeholder="Código"
                  value={newProduct.codigo}
                  onChange={(e) => setNewProduct({ ...newProduct, codigo: e.target.value })}
                  required
                />
                <Select
                  value={newProduct.categoriaId}
                  onValueChange={(value) => setNewProduct({ ...newProduct, categoriaId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Nombre del producto"
                  value={newProduct.nombre}
                  onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                  required
                />
                <Select
                  value={newProduct.estado}
                  onValueChange={(value) => setNewProduct({ ...newProduct, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Desactivado">Desactivado</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
              
              <TabsContent value="detalles" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Marca"
                    value={newProduct.marca}
                    onChange={(e) => setNewProduct({ ...newProduct, marca: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Modelo"
                    value={newProduct.modelo}
                    onChange={(e) => setNewProduct({ ...newProduct, modelo: e.target.value })}
                    required
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Stock inicial"
                  value={newProduct.stockTotal}
                  onChange={(e) => setNewProduct({ ...newProduct, stockTotal: e.target.value })}
                  required
                />
                <Input
                  placeholder="Unidad de medida"
                  value={newProduct.tipoUnidad}
                  onChange={(e) => setNewProduct({ ...newProduct, tipoUnidad: e.target.value })}
                  required
                />
              </TabsContent>
              
              <TabsContent value="precios" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Precio de Compra</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.precioCompra}
                      onChange={(e) => setNewProduct({ ...newProduct, precioCompra: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio de Venta</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.precioVenta}
                      onChange={(e) => setNewProduct({ ...newProduct, precioVenta: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DrawerFooter className="sticky bottom-0 bg-background mt-4">
              <Button type="submit">
                {editingProduct ? 'Actualizar' : 'Crear'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <Drawer open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Eliminar producto</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Está seguro que desea eliminar el producto {productoToDelete?.nombre}?
            </p>
            <DrawerFooter>
              <Button variant="destructive" onClick={confirmDelete}>
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

  const filteredProductos = searchQuery
    ? productos.filter(producto =>
        producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : productos;

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
            <Package className="mr-3 h-8 w-8 text-teal-500" />
            Productos
          </h1>
          <p className="text-muted-foreground">
            Administre el inventario de productos
          </p>
        </motion.div>

        {viewMode === 'cards' && (
          <motion.div variants={containerVariants}>
            <motion.div variants={itemVariants} className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              
              {canEdit() && (
                <button
                  onClick={handleAddProducto}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </button>
              )}
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={containerVariants}
            >
              {filteredProductos.map(producto => (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={producto.id}
                  className="bg-transparent rounded-xl border shadow-sm transition-all"
                  onClick={() => handleRowClick(producto)}
                >
                  <div className="h-40 rounded-t-xl overflow-hidden relative">
                    <img
                      src={getImageSrc(producto.foto, 'producto', producto.nombre)}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 dark:text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                      {producto.stockTotal > 0 ? 'En stock' : 'Agotado'}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{producto.nombre}</h3>
                        <p className="text-xs text-muted-foreground">{producto.codigo}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(producto.precioVenta)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-full">
                        {getCategoriaName(producto.categoriaId)}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{producto.stockTotal}</span>
                        <span className="text-muted-foreground ml-1">{producto.tipoUnidad}</span>
                      </div>
                      
                      {canEdit() && (
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(producto);
                                  }}
                                  className="p-2 rounded-md hover:bg-blue-50 text-blue-500 border border-blue-200"
                                >
                                  <PenSquare className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar producto</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {canDelete() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(producto);
                                    }}
                                    className="p-2 rounded-md hover:bg-red-50 text-red-500 border border-red-200"
                                  >
                                    <XSquare className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar producto</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {canEdit() && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  onClick={handleAddProducto}
                  className="bg-transparent h-full min-h-[15rem] p-5 rounded-xl border border-dashed shadow-sm flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                >
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">Agregar nuevo producto</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Clic para agregar un nuevo producto al inventario
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            <div className="transition-all hover:scale-[1.01] rounded-lg">
              <DataTable
                data={filteredProductos}
                columns={columns}
                title="Inventario de Productos"
                description="Todos los productos disponibles en el sistema"
                onRowClick={handleRowClick}
                searchKeys={["nombre", "codigo"]}
                searchPlaceholder="Buscar por nombre o código..."
                actions={canEdit() ? <DataTableActions onAdd={handleAddProducto} addLabel="Nuevo Producto" /> : null}
                onEdit={canEdit() ? handleEdit : undefined}
                onDelete={canDelete() ? handleDelete : undefined}
                className="transition-all"
              />
            </div>
          </motion.div>
        )}

        {isMobile ? renderMobileDrawers() : (
          <>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setIsDialogOpen(false);
                setEditingProduct(null);
                setNewProduct({
                  codigo: '',
                  nombre: '',
                  stockTotal: '',
                  tipoUnidad: '',
                  precioCompra: '',
                  precioVenta: '',
                  marca: '',
                  modelo: '',
                  estado: 'Activo',
                  categoriaId: '',
                  foto: ''
                });
              }
            }}>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitNewProduct}>
                  <div className="grid gap-4 py-4">
                    {photoInputSection}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="codigo">Código</Label>
                        <Input
                          id="codigo"
                          value={newProduct.codigo}
                          onChange={(e) => setNewProduct({ ...newProduct, codigo: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="categoria">Categoría</Label>
                        <Select
                          value={newProduct.categoriaId}
                          onValueChange={(value) => setNewProduct({ ...newProduct, categoriaId: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="nombre">Nombre del Producto</Label>
                      <Input
                        id="nombre"
                        value={newProduct.nombre}
                        onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="estado">Estado</Label>
                      <Select
                        value={newProduct.estado}
                        onValueChange={(value) => setNewProduct({ ...newProduct, estado: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Desactivado">Desactivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="marca">Marca</Label>
                        <Input
                          id="marca"
                          value={newProduct.marca}
                          onChange={(e) => setNewProduct({ ...newProduct, marca: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="modelo">Modelo</Label>
                        <Input
                          id="modelo"
                          value={newProduct.modelo}
                          onChange={(e) => setNewProduct({ ...newProduct, modelo: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="stockTotal">Stock Inicial</Label>
                        <Input
                          id="stockTotal"
                          type="number"
                          value={newProduct.stockTotal}
                          onChange={(e) => setNewProduct({ ...newProduct, stockTotal: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="tipoUnidad">Unidad de Medida</Label>
                        <Input
                          id="tipoUnidad"
                          value={newProduct.tipoUnidad}
                          onChange={(e) => setNewProduct({ ...newProduct, tipoUnidad: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="precioCompra">Precio de Compra</Label>
                        <Input
                          id="precioCompra"
                          type="number"
                          step="0.01"
                          value={newProduct.precioCompra}
                          onChange={(e) => setNewProduct({ ...newProduct, precioCompra: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="precioVenta">Precio de Venta</Label>
                        <Input
                          id="precioVenta"
                          type="number"
                          step="0.01"
                          value={newProduct.precioVenta}
                          onChange={(e) => setNewProduct({ ...newProduct, precioVenta: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar Producto</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro de eliminar este producto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El producto 
                    <span className="font-medium"> {productoToDelete?.nombre} </span>
                    será eliminado permanentemente del inventario.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setProductoToDelete(null)}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default Productos;
