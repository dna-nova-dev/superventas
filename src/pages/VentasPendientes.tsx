"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { DataTable } from "@/components/ui/DataTable";
import { formatCurrency } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Trash, CheckCircle, Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { deleteVenta, updateVenta } from "@/services/ventaService";
import { getVentas } from "@/services/ventaService";
import { Venta } from "@/types";

type EstadoVenta = 'pendiente' | 'completada' | 'cancelada' | 'devuelta';

const ESTADOS_VENTA: EstadoVenta[] = ['pendiente', 'completada', 'cancelada', 'devuelta'];
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VentasPendientes() {
  const { toast } = useToast();
  const { empresaId, user: currentUser } = useAuth();
  const { canDelete } = useRolePermissions();
  const [ventasPendientes, setVentasPendientes] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventaToDelete, setVentaToDelete] = useState<Venta | null>(null);
  const [ventaToComplete, setVentaToComplete] = useState<Venta | null>(null);
  const [ventaToView, setVentaToView] = useState<Venta | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EstadoVenta>('pendiente');
  const [pago, setPago] = useState("");
  const navigate = useNavigate();

  // Cargar ventas pendientes
  const loadVentasPendientes = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      console.log('Solicitando ventas pendientes...');
      
      // Usar getVentas con el estado "pendiente"
      const data = await getVentas("pendiente");
      console.log('Ventas pendientes recibidas:', data);
      
      setVentasPendientes(data);
    } catch (error) {
      console.error('Error al cargar ventas pendientes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas pendientes: " + (error instanceof Error ? error.message : 'Error desconocido'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [empresaId, toast]);

  // Cargar ventas pendientes al montar el componente
  useEffect(() => {
    loadVentasPendientes();
  }, [loadVentasPendientes]);

  // Eliminar venta pendiente
  // Actualizar el estado de la venta
  const handleUpdateStatus = async () => {
    if (!ventaToView) return;

    try {
      setUpdatingStatus(true);
      await updateVenta(ventaToView.id, { 
        ...ventaToView,
        estado: selectedStatus 
      });
      
      toast({
        title: "Estado actualizado",
        description: `La venta ha sido marcada como ${selectedStatus}`,
      });
      
      // Recargar la lista de ventas
      loadVentasPendientes();
      setVentaToView(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la venta",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Actualizar el estado seleccionado cuando se abre el modal
  useEffect(() => {
    if (ventaToView) {
      setSelectedStatus(ventaToView.estado);
    }
  }, [ventaToView]);

  const handleDeleteVenta = async () => {
    if (!ventaToDelete) return;

    try {
      await deleteVenta(ventaToDelete.id);
      toast({
        title: "Venta eliminada",
        description: "La venta pendiente ha sido eliminada correctamente",
      });
      setVentaToDelete(null);
      loadVentasPendientes();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la venta pendiente",
        variant: "destructive",
      });
    }
  };

  // Completar venta pendiente
  const handleCompleteVenta = async () => {
    if (!ventaToComplete) return;

    try {
      // Actualizar el estado de la venta a 'completada'
      await updateVenta(ventaToComplete.id, {
        ...ventaToComplete,
        estado: "completada" as EstadoVenta,
        pagado: pago || "0",
        // Calcular el cambio
        cambio: (
          parseFloat(pago || "0") - parseFloat(ventaToComplete.total)
        ).toFixed(2),
      });

      toast({
        title: "Venta completada",
        description: "La venta ha sido marcada como completada",
      });
      setVentaToComplete(null);
      setPago("");
      loadVentasPendientes();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la venta",
        variant: "destructive",
      });
    }
  };

  // Columnas para la tabla de ventas pendientes
  const columns = [
    {
      header: "Código",
      accessor: "codigo" as const,
    },
    {
      header: "Fecha",
      accessor: (venta: Venta) => {
        // Usar createdAt si está disponible, de lo contrario usar fecha
        const fecha = venta.createdAt || venta.fecha;
        if (!fecha) return "Sin fecha";
        
        // Crear objeto Date
        const fechaObj = new Date(fecha);
        
        // Verificar si la fecha es válida
        if (isNaN(fechaObj.getTime())) return "Fecha inválida";
        
        // Formatear la fecha según la configuración regional
        return fechaObj.toLocaleDateString('es-GT', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      },
    },
    {
      header: "Hora",
      accessor: (venta: Venta) => {
        // Usar createdAt si está disponible, de lo contrario usar hora
        const hora = venta.createdAt 
          ? new Date(venta.createdAt).toLocaleTimeString('es-GT', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })
          : venta.hora;
        
        return hora || "Sin hora";
      },
    },
    {
      header: "Cliente",
      accessor: (venta: Venta) => {
        if (!venta.cliente) return "Sin cliente";
        return [venta.cliente.nombre, venta.cliente.apellido].filter(Boolean).join(" ").trim();
      },
    },
    {
      header: "Vendedor",
      accessor: (venta: Venta) => {
        // Access the user's name from the actual API response structure
        const nombre = venta.usuario?.nombre || venta.usuario?.usuario || "Sin vendedor";
        const apellido = venta.usuario?.apellido || "";
        
        // Combine first and last name if last name exists
        return [nombre, apellido].filter(Boolean).join(" ").trim();
      },
    },
    {
      header: "Total",
      accessor: (venta: Venta) => formatCurrency(parseFloat(venta.total)),
    },
    {
      header: "Acciones",
      accessor: (venta: Venta) => (
        <div className="flex space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVentaToView(venta)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalles</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVentaToComplete(venta)}
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Completar venta</TooltipContent>
          </Tooltip>

          {canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVentaToDelete(venta)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Ventas Pendientes</h2>
        </div>

        <DataTable
          columns={columns}
          data={ventasPendientes}
          searchPlaceholder="Buscar ventas pendientes..."
          searchKeys={["codigo"]}
        />

        {/* Add a loading indicator outside the DataTable */}
        {loading && (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={!!ventaToDelete}
        onOpenChange={(open) => !open && setVentaToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar venta pendiente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas
              eliminar esta venta pendiente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVentaToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteVenta}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para completar venta */}
      <Dialog
        open={!!ventaToComplete}
        onOpenChange={(open) => !open && setVentaToComplete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Venta</DialogTitle>
            <DialogDescription>
              Ingrese el monto con el que pagó el cliente para calcular el
              cambio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pago">Monto Pagado</Label>
              <Input
                id="pago"
                type="number"
                value={pago}
                onChange={(e) => setPago(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            {ventaToComplete && pago && (
              <div className="space-y-2">
                <p>
                  Total: {formatCurrency(parseFloat(ventaToComplete.total))}
                </p>
                <p>Pago: {formatCurrency(parseFloat(pago))}</p>
                <p className="font-bold">
                  Cambio:{" "}
                  {formatCurrency(
                    parseFloat(pago) - parseFloat(ventaToComplete.total)
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVentaToComplete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCompleteVenta}
              disabled={
                !pago ||
                parseFloat(pago) < parseFloat(ventaToComplete?.total || "0")
              }
            >
              Completar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalles de Venta */}
      <Dialog open={!!ventaToView} onOpenChange={(open) => !open && setVentaToView(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Venta</DialogTitle>
            <DialogDescription>
              Información detallada de la venta {ventaToView?.codigo}
            </DialogDescription>
          </DialogHeader>
          
          {ventaToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Código:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ventaToView.codigo}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fecha y Hora:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {(() => {
                      // Usar createdAt si está disponible, de lo contrario usar fecha y hora por separado
                      const fechaHora = ventaToView.createdAt 
                        ? new Date(ventaToView.createdAt)
                        : ventaToView.fecha 
                          ? new Date(`${ventaToView.fecha}T${ventaToView.hora || '00:00:00'}`)
                          : null;
                      
                      if (!fechaHora || isNaN(fechaHora.getTime())) {
                        return 'Fecha no disponible';
                      }
                      
                      // Formatear fecha
                      const fechaFormateada = fechaHora.toLocaleDateString('es-GT', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      });
                      
                      // Formatear hora
                      const horaFormateada = fechaHora.toLocaleTimeString('es-GT', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      
                      return `${fechaFormateada} ${horaFormateada}`;
                    })()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cliente:</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {ventaToView.cliente 
                        ? `${ventaToView.cliente.nombre} ${ventaToView.cliente.apellido || ''}`.trim()
                        : 'Sin cliente'}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">{ventaToView.cliente.tipoDocumento}:</span> {ventaToView.cliente.numeroDocumento}
                    </p>
                    {ventaToView.cliente.email && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Email:</span> {ventaToView.cliente.email}
                      </p>
                    )}
                    {ventaToView.cliente.telefono && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Teléfono:</span> {ventaToView.cliente.telefono}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 space-y-1">
                      {ventaToView.cliente.direccion && (
                        <p><span className="font-medium">Dirección:</span> {ventaToView.cliente.direccion}</p>
                      )}
                      {(ventaToView.cliente.municipio || ventaToView.cliente.departamento) && (
                        <p><span className="font-medium">Ubicación:</span> {[ventaToView.cliente.municipio, ventaToView.cliente.departamento].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Vendedor:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {ventaToView.usuario 
                      ? `${ventaToView.usuario.nombre || ventaToView.usuario.usuario || 'Sin nombre'} ${ventaToView.usuario.apellido || ''}`.trim()
                      : 'Sin vendedor'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Productos:</h4>
                <div className="space-y-2">
                  {ventaToView.detalles?.map((detalle, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">
                          {detalle.descripcion || `Producto #${detalle.productoId || 'N/A'}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {detalle.cantidad} x {formatCurrency(Number(detalle.precioVenta) || 0)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(Number(detalle.total) || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t">
                <div className="space-y-2">
                  <p className="font-medium">Estado actual:</p>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={(value: EstadoVenta) => setSelectedStatus(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_VENTA.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Total:</p>
                  <p className="text-lg font-bold">{formatCurrency(parseFloat(ventaToView.total))}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setVentaToView(null)}
              disabled={updatingStatus}
            >
              Cerrar
            </Button>
            <Button 
              type="button"
              onClick={handleUpdateStatus}
              disabled={updatingStatus || selectedStatus === ventaToView?.estado}
            >
              {updatingStatus ? 'Guardando...' : 'Actualizar Estado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
